from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= Models =============
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    role: str = "customer"  # customer, store_owner, admin

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    phone: Optional[str] = None
    role: str
    address: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Store(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    store_name: str
    description: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected
    logo: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StoreCreate(BaseModel):
    store_name: str
    description: Optional[str] = None
    logo: Optional[str] = None

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_ar: str
    name_en: str
    slug: str
    icon: Optional[str] = None

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    store_id: str
    category_id: str
    name: str
    description: Optional[str] = None
    price: float
    images: List[str] = []
    stock: int = 0
    status: str = "active"  # active, inactive
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    category_id: str
    name: str
    description: Optional[str] = None
    price: float
    images: List[str] = []
    stock: int = 0

class CartItem(BaseModel):
    product_id: str
    quantity: int

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[dict] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    items: List[dict] = []
    total_amount: float
    status: str = "pending"  # pending, confirmed, shipped, delivered, cancelled
    shipping_address: str
    phone: str
    payment_method: str = "cash_on_delivery"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    shipping_address: str
    phone: str

# ============= Auth Functions =============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============= Auth Routes =============
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        phone=user_data.phone,
        role=user_data.role
    )
    
    doc = user.model_dump()
    doc['password_hash'] = hash_password(user_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    token = create_access_token({"user_id": user.id, "role": user.role})
    return {"token": token, "user": user.model_dump()}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"user_id": user['id'], "role": user['role']})
    user_data = {k: v for k, v in user.items() if k != 'password_hash'}
    return {"token": token, "user": user_data}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != 'password_hash'}

# ============= Store Routes =============
@api_router.post("/stores")
async def create_store(store_data: StoreCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['store_owner', 'admin']:
        raise HTTPException(status_code=403, detail="Only store owners can create stores")
    
    store = Store(
        owner_id=current_user['id'],
        store_name=store_data.store_name,
        description=store_data.description,
        logo=store_data.logo
    )
    
    doc = store.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.stores.insert_one(doc)
    return store

@api_router.get("/stores", response_model=List[Store])
async def get_stores(status: Optional[str] = None):
    query = {}
    if status:
        query['status'] = status
    stores = await db.stores.find(query, {"_id": 0}).to_list(1000)
    for store in stores:
        if isinstance(store.get('created_at'), str):
            store['created_at'] = datetime.fromisoformat(store['created_at'])
    return stores

@api_router.get("/stores/my")
async def get_my_stores(current_user: dict = Depends(get_current_user)):
    stores = await db.stores.find({"owner_id": current_user['id']}, {"_id": 0}).to_list(100)
    for store in stores:
        if isinstance(store.get('created_at'), str):
            store['created_at'] = datetime.fromisoformat(store['created_at'])
    return stores

@api_router.patch("/stores/{store_id}/approve")
async def approve_store(store_id: str, status: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can approve stores")
    
    result = await db.stores.update_one(
        {"id": store_id},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Store not found")
    
    return {"message": "Store status updated"}

# ============= Category Routes =============
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@api_router.post("/categories")
async def create_category(category: Category, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can create categories")
    
    doc = category.model_dump()
    await db.categories.insert_one(doc)
    return category

# ============= Product Routes =============
@api_router.post("/products")
async def create_product(product_data: ProductCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['store_owner', 'admin']:
        raise HTTPException(status_code=403, detail="Only store owners can create products")
    
    # Get user's store
    store = await db.stores.find_one({"owner_id": current_user['id'], "status": "approved"}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=403, detail="You need an approved store to add products")
    
    product = Product(
        store_id=store['id'],
        category_id=product_data.category_id,
        name=product_data.name,
        description=product_data.description,
        price=product_data.price,
        images=product_data.images,
        stock=product_data.stock
    )
    
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    return product

@api_router.get("/products")
async def get_products(category_id: Optional[str] = None, store_id: Optional[str] = None):
    query = {"status": "active"}
    if category_id:
        query['category_id'] = category_id
    if store_id:
        query['store_id'] = store_id
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    return product

@api_router.patch("/products/{product_id}")
async def update_product(product_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    store = await db.stores.find_one({"id": product['store_id']}, {"_id": 0})
    if store['owner_id'] != current_user['id'] and current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.products.update_one({"id": product_id}, {"$set": updates})
    return {"message": "Product updated"}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    store = await db.stores.find_one({"id": product['store_id']}, {"_id": 0})
    if store['owner_id'] != current_user['id'] and current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.products.delete_one({"id": product_id})
    return {"message": "Product deleted"}

# ============= Cart Routes =============
@api_router.get("/cart")
async def get_cart(current_user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not cart:
        return {"items": []}
    
    # Fetch product details
    enriched_items = []
    for item in cart.get('items', []):
        product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
        if product:
            enriched_items.append({
                "product": product,
                "quantity": item['quantity']
            })
    
    return {"items": enriched_items}

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, current_user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user['id']}, {"_id": 0})
    
    if not cart:
        cart = Cart(user_id=current_user['id'], items=[])
        doc = cart.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.carts.insert_one(doc)
    
    items = cart.get('items', []) if isinstance(cart, dict) else []
    existing_item = next((i for i in items if i['product_id'] == item.product_id), None)
    
    if existing_item:
        existing_item['quantity'] += item.quantity
    else:
        items.append({"product_id": item.product_id, "quantity": item.quantity})
    
    await db.carts.update_one(
        {"user_id": current_user['id']},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Item added to cart"}

@api_router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, current_user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = [i for i in cart.get('items', []) if i['product_id'] != product_id]
    await db.carts.update_one(
        {"user_id": current_user['id']},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Item removed from cart"}

# ============= Order Routes =============
@api_router.post("/orders")
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not cart or not cart.get('items'):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate total
    total = 0
    order_items = []
    for item in cart['items']:
        product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
        if product:
            total += product['price'] * item['quantity']
            order_items.append({
                "product_id": product['id'],
                "product_name": product['name'],
                "price": product['price'],
                "quantity": item['quantity']
            })
    
    order = Order(
        customer_id=current_user['id'],
        items=order_items,
        total_amount=total,
        shipping_address=order_data.shipping_address,
        phone=order_data.phone
    )
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.orders.insert_one(doc)
    
    # Clear cart
    await db.carts.update_one(
        {"user_id": current_user['id']},
        {"$set": {"items": []}}
    )
    
    return order

@api_router.get("/orders/my")
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"customer_id": current_user['id']}, {"_id": 0}).to_list(100)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders

@api_router.get("/orders")
async def get_all_orders(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can view all orders")
    
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders

@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can update order status")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

# Health check
@api_router.get("/")
async def root():
    return {"message": "Marketplace API is running"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
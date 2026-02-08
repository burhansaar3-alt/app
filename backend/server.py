from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Request
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
import base64

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
api_router = APIRouter()

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

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str

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
    phone: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected
    logo: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StoreCreate(BaseModel):
    store_name: str
    description: Optional[str] = None
    phone: Optional[str] = None
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
    sizes: List[str] = []  # S, M, L, XL, XXL
    colors: List[dict] = []  # [{"name": "أحمر", "hex": "#FF0000", "image": "url"}]
    shoe_sizes: List[str] = []  # 38, 39, 40, 41, 42, 43, 44
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    category_id: str
    name: str
    description: Optional[str] = None
    price: float
    images: List[str] = []
    stock: int = 0
    sizes: List[str] = []
    colors: List[dict] = []
    shoe_sizes: List[str] = []

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
    payment_method: str = "cash_on_delivery"  # cash_on_delivery, visa, cash
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    shipping_address: str
    phone: str
    payment_method: str = "cash_on_delivery"
    coupon_code: Optional[str] = None

class Wishlist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_ids: List[str] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    user_id: str
    rating: int  # 1-5
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: Optional[str] = None

class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    discount_type: str  # percentage or fixed
    discount_value: float
    min_purchase: float = 0
    max_uses: int = 0
    used_count: int = 0
    expires_at: Optional[datetime] = None
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CouponCreate(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    min_purchase: float = 0
    max_uses: int = 0
    expires_at: Optional[str] = None

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

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Send password reset code to user's email"""
    # Check if user exists
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user:
        # Don't reveal if user exists for security
        return {"message": "If email exists, reset code has been sent", "code": None}
    
    # Generate 4-digit reset code
    import random
    reset_code = str(random.randint(1000, 9999))
    
    # Store reset code in database (expires in 10 minutes)
    reset_data = {
        "email": request.email,
        "code": reset_code,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
        "used": False
    }
    
    # Remove old reset codes for this email
    await db.password_resets.delete_many({"email": request.email})
    await db.password_resets.insert_one(reset_data)
    
    # Print code to console for development
    print(f"\n{'='*50}")
    print(f"Reset Code: {reset_code} for {request.email}")
    print(f"{'='*50}\n")
    
    # Check if SMTP is configured
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_user = os.environ.get('SMTP_USER')
    email_sent = False
    
    if smtp_host and smtp_user:
        # Try to send email
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            smtp_port = int(os.environ.get('SMTP_PORT', 587))
            smtp_password = os.environ.get('SMTP_PASSWORD')
            smtp_from = os.environ.get('SMTP_FROM', smtp_user)
            
            # Create email
            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'رمز إعادة تعيين كلمة المرور - سوق سوريا'
            msg['From'] = smtp_from
            msg['To'] = request.email
            
            # Email body
            html = f'''
            <html dir="rtl">
              <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #ea580c; margin-bottom: 20px;">رمز إعادة تعيين كلمة المرور</h2>
                    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                      مرحباً،
                    </p>
                    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                      تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في سوق سوريا.
                    </p>
                    <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
                      <p style="font-size: 14px; color: #92400e; margin-bottom: 10px;">رمز التحقق الخاص بك:</p>
                      <h1 style="font-size: 48px; color: #ea580c; margin: 10px 0; letter-spacing: 8px;">{reset_code}</h1>
                    </div>
                    <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
                      هذا الرمز صالح لمدة <strong>10 دقائق</strong> فقط.
                    </p>
                    <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
                      إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                      © 2025 سوق سوريا. جميع الحقوق محفوظة.
                    </p>
                  </div>
                </div>
              </body>
            </html>
            '''
            
            part = MIMEText(html, 'html')
            msg.attach(part)
            
            # Send email
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
            
            email_sent = True
            print(f"✅ Email sent successfully to {request.email}")
            
        except Exception as e:
            print(f"❌ Failed to send email: {str(e)}")
            email_sent = False
    
    # Return response with code in development mode
    # In production, remove the 'code' field for security
    dev_mode = os.environ.get('ENVIRONMENT', 'development') == 'development'
    
    return {
        "message": "تم إرسال رمز التحقق" if email_sent else "تم إنشاء رمز التحقق",
        "code": reset_code if dev_mode and not email_sent else None,
        "email_sent": email_sent
    }

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password using verification code"""
    # Find valid reset code
    reset = await db.password_resets.find_one({
        "email": request.email,
        "code": request.code,
        "used": False,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    }, {"_id": 0})
    
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")
    
    # Hash new password
    password_hash = bcrypt.hashpw(request.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Update user password
    result = await db.users.update_one(
        {"email": request.email},
        {"$set": {"password_hash": password_hash}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Mark reset code as used
    await db.password_resets.update_one(
        {"email": request.email, "code": request.code},
        {"$set": {"used": True}}
    )
    
    print(f"✅ Password reset successful for {request.email}")
    
    return {"message": "Password reset successful"}

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

@api_router.delete("/stores/{store_id}")
async def delete_store(store_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can delete stores")
    
    # Check if store exists
    store = await db.stores.find_one({"id": store_id}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Delete all products from this store
    products_result = await db.products.delete_many({"store_id": store_id})
    
    # Delete the store
    await db.stores.delete_one({"id": store_id})
    
    return {
        "message": "Store and all its products deleted successfully",
        "products_deleted": products_result.deleted_count
    }

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
async def get_products(
    category_id: Optional[str] = None,
    store_id: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None  # newest, price_low, price_high, rating
):
    query = {"status": "active"}
    if category_id:
        query['category_id'] = category_id
    if store_id:
        query['store_id'] = store_id
    if min_price is not None:
        query['price'] = query.get('price', {})
        query['price']['$gte'] = min_price
    if max_price is not None:
        query['price'] = query.get('price', {})
        query['price']['$lte'] = max_price
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}}
        ]
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    
    # Get reviews for rating sort
    if sort_by == 'rating':
        for product in products:
            reviews = await db.reviews.find({"product_id": product['id']}).to_list(100)
            product['avg_rating'] = sum(r['rating'] for r in reviews) / len(reviews) if reviews else 0
    
    # Sort products
    if sort_by == 'newest':
        products.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    elif sort_by == 'price_low':
        products.sort(key=lambda x: x.get('price', 0))
    elif sort_by == 'price_high':
        products.sort(key=lambda x: x.get('price', 0), reverse=True)
    elif sort_by == 'rating':
        products.sort(key=lambda x: x.get('avg_rating', 0), reverse=True)
    
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

@api_router.get("/products/{product_id}/similar")
async def get_similar_products(product_id: str, limit: int = 4):
    # Get the product
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Find similar products from same category
    similar = await db.products.find({
        "category_id": product['category_id'],
        "id": {"$ne": product_id},
        "status": "active"
    }, {"_id": 0}).limit(limit).to_list(limit)
    
    for p in similar:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    
    return similar

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

@api_router.put("/products/{product_id}")
async def update_product_full(product_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    store = await db.stores.find_one({"id": product['store_id']}, {"_id": 0})
    if store['owner_id'] != current_user['id'] and current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Keep the original store_id
    updates['store_id'] = product['store_id']
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

# ============= Image Upload Route =============
@api_router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['store_owner', 'admin']:
        raise HTTPException(status_code=403, detail="Only store owners can upload images")
    
    # Read file content
    contents = await file.read()
    
    # Convert to base64
    base64_image = base64.b64encode(contents).decode('utf-8')
    
    # Create data URL
    file_ext = file.filename.split('.')[-1].lower()
    mime_type = f"image/{file_ext}" if file_ext in ['jpg', 'jpeg', 'png', 'gif', 'webp'] else "image/jpeg"
    data_url = f"data:{mime_type};base64,{base64_image}"
    
    return {"url": data_url, "image_url": data_url}

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
    
    # Apply coupon if provided
    discount = 0
    coupon_code = None
    if order_data.coupon_code:
        coupon = await db.coupons.find_one({"code": order_data.coupon_code.upper(), "active": True}, {"_id": 0})
        if coupon:
            # Check validity
            if coupon.get('expires_at'):
                expires = datetime.fromisoformat(coupon['expires_at']) if isinstance(coupon['expires_at'], str) else coupon['expires_at']
                if expires >= datetime.now(timezone.utc):
                    if coupon['max_uses'] == 0 or coupon['used_count'] < coupon['max_uses']:
                        if total >= coupon['min_purchase']:
                            # Apply discount
                            if coupon['discount_type'] == 'percentage':
                                discount = total * (coupon['discount_value'] / 100)
                            else:
                                discount = coupon['discount_value']
                            
                            coupon_code = coupon['code']
                            # Increment usage
                            await db.coupons.update_one(
                                {"code": coupon['code']},
                                {"$inc": {"used_count": 1}}
                            )
    
    final_total = max(0, total - discount)
    
    order = Order(
        customer_id=current_user['id'],
        items=order_items,
        total_amount=final_total,
        shipping_address=order_data.shipping_address,
        phone=order_data.phone,
        payment_method=order_data.payment_method
    )
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['original_total'] = total
    doc['discount'] = discount
    doc['coupon_code'] = coupon_code
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

@api_router.get("/orders/store")
async def get_store_orders(current_user: dict = Depends(get_current_user)):
    """Get orders for store owner's products"""
    # Find user's store
    store = await db.stores.find_one({"owner_id": current_user['id'], "status": "approved"}, {"_id": 0})
    if not store:
        return []
    
    # Find products from this store
    store_products = await db.products.find({"store_id": store['id']}, {"_id": 0}).to_list(1000)
    product_ids = [p['id'] for p in store_products]
    
    # Find orders containing these products
    all_orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    store_orders = []
    
    for order in all_orders:
        order_items = order.get('items', [])
        for item in order_items:
            if item.get('product_id') in product_ids:
                # Calculate total for this store's items
                store_total = sum(
                    i.get('price', 0) * i.get('quantity', 1) 
                    for i in order_items 
                    if i.get('product_id') in product_ids
                )
                order['total'] = store_total
                store_orders.append(order)
                break
    
    return store_orders

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
    # Allow admins and store owners to update order status
    if current_user['role'] not in ['admin', 'store_owner']:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

# ============= Wishlist Routes =============
@api_router.get("/wishlist")
async def get_wishlist(current_user: dict = Depends(get_current_user)):
    wishlist = await db.wishlists.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not wishlist:
        return {"products": []}
    
    # Fetch product details
    products = []
    for product_id in wishlist.get('product_ids', []):
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        if product:
            products.append(product)
    
    return {"products": products}

@api_router.post("/wishlist/add/{product_id}")
async def add_to_wishlist(product_id: str, current_user: dict = Depends(get_current_user)):
    wishlist = await db.wishlists.find_one({"user_id": current_user['id']}, {"_id": 0})
    
    if not wishlist:
        wishlist = Wishlist(user_id=current_user['id'], product_ids=[product_id])
        doc = wishlist.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.wishlists.insert_one(doc)
    else:
        product_ids = wishlist.get('product_ids', [])
        if product_id not in product_ids:
            product_ids.append(product_id)
            await db.wishlists.update_one(
                {"user_id": current_user['id']},
                {"$set": {"product_ids": product_ids, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
    
    return {"message": "Product added to wishlist"}

@api_router.delete("/wishlist/remove/{product_id}")
async def remove_from_wishlist(product_id: str, current_user: dict = Depends(get_current_user)):
    wishlist = await db.wishlists.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    
    product_ids = [pid for pid in wishlist.get('product_ids', []) if pid != product_id]
    await db.wishlists.update_one(
        {"user_id": current_user['id']},
        {"$set": {"product_ids": product_ids, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Product removed from wishlist"}

# ============= Reviews Routes =============
@api_router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(100)
    
    # Enrich with user names
    enriched_reviews = []
    for review in reviews:
        user = await db.users.find_one({"id": review['user_id']}, {"_id": 0, "name": 1})
        review_data = review.copy()
        review_data['user_name'] = user.get('name', 'مستخدم') if user else 'مستخدم'
        if isinstance(review_data.get('created_at'), str):
            review_data['created_at'] = datetime.fromisoformat(review_data['created_at'])
        enriched_reviews.append(review_data)
    
    # Calculate average rating
    avg_rating = sum(r['rating'] for r in reviews) / len(reviews) if reviews else 0
    
    return {
        "reviews": enriched_reviews,
        "average_rating": round(avg_rating, 1),
        "total_reviews": len(reviews)
    }

@api_router.post("/reviews")
async def create_review(review_data: ReviewCreate, current_user: dict = Depends(get_current_user)):
    # Check if user already reviewed this product
    existing = await db.reviews.find_one({
        "product_id": review_data.product_id,
        "user_id": current_user['id']
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this product")
    
    review = Review(
        product_id=review_data.product_id,
        user_id=current_user['id'],
        rating=review_data.rating,
        comment=review_data.comment
    )
    
    doc = review.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.reviews.insert_one(doc)
    
    return review

# ============= Coupons Routes =============
@api_router.post("/coupons")
async def create_coupon(coupon_data: CouponCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can create coupons")
    
    # Check if code exists
    existing = await db.coupons.find_one({"code": coupon_data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    coupon = Coupon(
        code=coupon_data.code.upper(),
        discount_type=coupon_data.discount_type,
        discount_value=coupon_data.discount_value,
        min_purchase=coupon_data.min_purchase,
        max_uses=coupon_data.max_uses,
        expires_at=datetime.fromisoformat(coupon_data.expires_at) if coupon_data.expires_at else None
    )
    
    doc = coupon.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('expires_at'):
        doc['expires_at'] = doc['expires_at'].isoformat()
    
    await db.coupons.insert_one(doc)
    return coupon

@api_router.get("/coupons/validate/{code}")
async def validate_coupon(code: str, total: float):
    coupon = await db.coupons.find_one({"code": code.upper(), "active": True}, {"_id": 0})
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    # Check expiry
    if coupon.get('expires_at'):
        expires = datetime.fromisoformat(coupon['expires_at']) if isinstance(coupon['expires_at'], str) else coupon['expires_at']
        if expires < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Coupon expired")
    
    # Check max uses
    if coupon['max_uses'] > 0 and coupon['used_count'] >= coupon['max_uses']:
        raise HTTPException(status_code=400, detail="Coupon limit reached")
    
    # Check minimum purchase
    if total < coupon['min_purchase']:
        raise HTTPException(status_code=400, detail=f"Minimum purchase of {coupon['min_purchase']} required")
    
    # Calculate discount
    if coupon['discount_type'] == 'percentage':
        discount = total * (coupon['discount_value'] / 100)
    else:
        discount = coupon['discount_value']
    
    return {
        "valid": True,
        "discount": discount,
        "final_total": max(0, total - discount)
    }

@api_router.get("/coupons")
async def get_coupons(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can view all coupons")
    
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(100)
    return coupons

# Health check
@api_router.get("/")
async def root():
    return {"message": "Marketplace API is running"}

# ============= Stripe Payment Routes =============
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
    CheckoutSessionRequest
)

class PaymentPackage(BaseModel):
    package_id: str
    origin_url: str

# Fixed payment packages (NEVER accept amount from frontend!)
PAYMENT_PACKAGES = {
    "delivery_standard": 5000.0,  # 5000 ل.س
    "delivery_express": 10000.0,  # 10000 ل.س
    "delivery_premium": 15000.0,  # 15000 ل.س
}

@api_router.post("/payments/checkout")
async def create_checkout(
    payment_data: PaymentPackage,
    current_user: dict = Depends(get_current_user),
    http_request: Request = None
):
    """Create Stripe checkout session"""
    # Validate package
    if payment_data.package_id not in PAYMENT_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid payment package")
    
    # Get amount from server-side definition
    amount = PAYMENT_PACKAGES[payment_data.package_id]
    
    # Initialize Stripe
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    webhook_url = f"{payment_data.origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    # Build URLs from provided origin
    success_url = f"{payment_data.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{payment_data.origin_url}/cart"
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="usd",  # Using USD as SYP not supported
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": current_user['id'],
            "user_email": current_user['email'],
            "package_id": payment_data.package_id
        }
    )
    
    try:
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        transaction = {
            "session_id": session.session_id,
            "user_id": current_user['id'],
            "user_email": current_user['email'],
            "package_id": payment_data.package_id,
            "amount": amount,
            "currency": "usd",
            "payment_status": "pending",
            "status": "initiated",
            "created_at": datetime.now(timezone.utc),
            "metadata": checkout_request.metadata
        }
        
        await db.payment_transactions.insert_one(transaction)
        
        return {"url": session.url, "session_id": session.session_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check payment status"""
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    # Dummy webhook URL for status check
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="http://dummy")
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction in database
        transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        
        if transaction and transaction.get('payment_status') != 'paid':
            # Update only if not already processed
            update_data = {
                "payment_status": status.payment_status,
                "status": status.status,
                "updated_at": datetime.now(timezone.utc)
            }
            
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": update_data}
            )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check status: {str(e)}")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
    
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        if not signature:
            raise HTTPException(status_code=400, detail="Missing signature")
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook event
        if webhook_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": "paid",
                    "status": "completed",
                    "webhook_event_id": webhook_response.event_id,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
        
        return {"status": "success"}
        
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

app.include_router(api_router, prefix="/api")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
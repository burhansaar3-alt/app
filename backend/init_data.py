import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

async def init_database():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Create admin user
    admin_exists = await db.users.find_one({"email": "admin@syriamarket.com"})
    if not admin_exists:
        password_hash = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin = {
            "id": str(uuid.uuid4()),
            "email": "admin@syriamarket.com",
            "name": "المدير العام",
            "phone": "0999999999",
            "role": "admin",
            "password_hash": password_hash,
            "created_at": "2025-01-01T00:00:00+00:00"
        }
        await db.users.insert_one(admin)
        print("✓ تم إنشاء حساب الأدمن: admin@syriamarket.com / admin123")
    else:
        print("✓ حساب الأدمن موجود مسبقاً")
    
    # Create categories
    categories_exist = await db.categories.count_documents({})
    if categories_exist == 0:
        categories = [
            {
                "id": str(uuid.uuid4()),
                "name_ar": "أزياء رجالية",
                "name_en": "Men's Fashion",
                "slug": "mens-fashion",
                "icon": "👔"
            },
            {
                "id": str(uuid.uuid4()),
                "name_ar": "أزياء نسائية",
                "name_en": "Women's Fashion",
                "slug": "womens-fashion",
                "icon": "👗"
            },
            {
                "id": str(uuid.uuid4()),
                "name_ar": "أدوات منزلية",
                "name_en": "Home & Kitchen",
                "slug": "home-kitchen",
                "icon": "🏠"
            },
            {
                "id": str(uuid.uuid4()),
                "name_ar": "أحذية للرجال",
                "name_en": "Men's Shoes",
                "slug": "mens-shoes",
                "icon": "👞"
            },
            {
                "id": str(uuid.uuid4()),
                "name_ar": "أحذية للنساء",
                "name_en": "Women's Shoes",
                "slug": "womens-shoes",
                "icon": "👠"
            },
            {
                "id": str(uuid.uuid4()),
                "name_ar": "حقائب وشنط",
                "name_en": "Bags & Handbags",
                "slug": "bags-handbags",
                "icon": "👜"
            }
        ]
        await db.categories.insert_many(categories)
        print(f"✓ تم إنشاء {len(categories)} فئة")
    else:
        print("✓ الفئات موجودة مسبقاً")
    
    # Sample product images from vision expert
    sample_images = {
        "mens-fashion": [
            "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzYwOTIxNzMzfDA&ixlib=rb-4.1.0&q=85",
            "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzYwOTIxNzMzfDA&ixlib=rb-4.1.0&q=85"
        ],
        "womens-fashion": [
            "https://images.unsplash.com/photo-1445205170230-053b83016050?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHw0fHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MHx8fHwxNzYwOTIxNzMzfDA&ixlib=rb-4.1.0&q=85",
            "https://images.pexels.com/photos/34329930/pexels-photo-34329930.jpeg"
        ],
        "home-kitchen": [
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxob21lJTIwYXBwbGlhbmNlc3xlbnwwfHx8fDE3NjA5MjE3Mzh8MA&ixlib=rb-4.1.0&q=85",
            "https://images.unsplash.com/photo-1570222094114-d054a817e56b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwyfHxob21lJTIwYXBwbGlhbmNlc3xlbnwwfHx8fDE3NjA5MjE3Mzh8MA&ixlib=rb-4.1.0&q=85"
        ],
        "shoes": [
            "https://images.unsplash.com/photo-1662037129545-1f5267dbf5e2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwyfHxzaG9lcyUyMHNuZWFrZXJzfGVufDB8fHx8MTc2MDkyMTc0M3ww&ixlib=rb-4.1.0&q=85",
            "https://images.unsplash.com/photo-1662037131816-aa2d7245166c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwzfHxzaG9lcyUyMHNuZWFrZXJzfGVufDB8fHx8MTc2MDkyMTc0M3ww&ixlib=rb-4.1.0&q=85"
        ],
        "bags": [
            "https://images.unsplash.com/photo-1636347522564-1f71a4116355?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHxiYWdzJTIwaGFuZGJhZ3N8ZW58MHx8fHwxNzYwOTIxNzQ3fDA&ixlib=rb-4.1.0&q=85",
            "https://images.unsplash.com/photo-1660695828417-9cc2724bf656?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwyfHxiYWdzJTIwaGFuZGJhZ3N8ZW58MHx8fHwxNzYwOTIxNzQ3fDA&ixlib=rb-4.1.0&q=85"
        ]
    }
    
    # Create sample store and products
    sample_store_exists = await db.stores.find_one({"store_name": "متجر الموضة السوري"})
    if not sample_store_exists:
        store = {
            "id": str(uuid.uuid4()),
            "owner_id": admin['id'],
            "store_name": "متجر الموضة السوري",
            "description": "متجر رائد في الأزياء والإكسسوارات",
            "status": "approved",
            "created_at": "2025-01-01T00:00:00+00:00"
        }
        await db.stores.insert_one(store)
        print("✓ تم إنشاء متجر تجريبي")
        
        # Add sample products
        cats = await db.categories.find({}, {"_id": 0}).to_list(100)
        sample_products = [
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": next((c['id'] for c in cats if c['slug'] == 'mens-fashion'), ''),
                "name": "قميص رجالي كلاسيكي",
                "description": "قميص رجالي أنيق ومريح للارتداء اليومي",
                "price": 75000,
                "images": [sample_images['mens-fashion'][0]],
                "stock": 50,
                "status": "active",
                "created_at": "2025-01-01T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": next((c['id'] for c in cats if c['slug'] == 'womens-fashion'), ''),
                "name": "فستان نسائي عصري",
                "description": "فستان نسائي جذاب بتصميم حديث",
                "price": 120000,
                "images": [sample_images['womens-fashion'][0]],
                "stock": 30,
                "status": "active",
                "created_at": "2025-01-01T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": next((c['id'] for c in cats if c['slug'] == 'home-kitchen'), ''),
                "name": "مجموعة أدوات مطبخ",
                "description": "مجموعة كاملة من أدوات المطبخ العصرية",
                "price": 95000,
                "images": [sample_images['home-kitchen'][0]],
                "stock": 25,
                "status": "active",
                "created_at": "2025-01-01T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": next((c['id'] for c in cats if c['slug'] == 'mens-shoes'), ''),
                "name": "حذاء رياضي للرجال",
                "description": "حذاء رياضي مريح وعصري",
                "price": 85000,
                "images": [sample_images['shoes'][0]],
                "stock": 40,
                "status": "active",
                "created_at": "2025-01-01T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": next((c['id'] for c in cats if c['slug'] == 'womens-shoes'), ''),
                "name": "حذاء نسائي أنيق",
                "description": "حذاء نسائي بتصميم راقي",
                "price": 90000,
                "images": [sample_images['shoes'][1]],
                "stock": 35,
                "status": "active",
                "created_at": "2025-01-01T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": next((c['id'] for c in cats if c['slug'] == 'bags-handbags'), ''),
                "name": "حقيبة يد فاخرة",
                "description": "حقيبة يد نسائية بتصميم فاخر",
                "price": 110000,
                "images": [sample_images['bags'][0]],
                "stock": 20,
                "status": "active",
                "created_at": "2025-01-01T00:00:00+00:00"
            }
        ]
        await db.products.insert_many(sample_products)
        print(f"✓ تم إنشاء {len(sample_products)} منتج تجريبي")
    else:
        print("✓ المتجر التجريبي موجود مسبقاً")
    
    client.close()
    print("\n✅ تم تهيئة قاعدة البيانات بنجاح!")

if __name__ == "__main__":
    asyncio.run(init_database())

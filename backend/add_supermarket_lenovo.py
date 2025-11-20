import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

async def add_supermarket_and_lenovo():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # 1. Add Supermarket category
    print("=" * 50)
    print("إضافة فئة السوبر ماركت...")
    print("=" * 50)
    
    supermarket_cat = {
        "id": str(uuid.uuid4()),
        "name_ar": "سوبر ماركت",
        "name_en": "Supermarket",
        "slug": "supermarket",
        "icon": "🛒"
    }
    
    exists = await db.categories.find_one({"slug": "supermarket"})
    if not exists:
        await db.categories.insert_one(supermarket_cat)
        print("✓ تمت إضافة فئة: سوبر ماركت")
    else:
        supermarket_cat = exists
        print("✓ فئة السوبر ماركت موجودة مسبقاً")
    
    # 2. Create Lenovo store owner account
    print("\n" + "=" * 50)
    print("إنشاء حساب لينوفو...")
    print("=" * 50)
    
    lenovo_email = "lenovo@syriamarket.com"
    lenovo_password = "Lenovo@2025"
    
    existing_user = await db.users.find_one({"email": lenovo_email})
    
    if not existing_user:
        password_hash = bcrypt.hashpw(lenovo_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        lenovo_user = {
            "id": str(uuid.uuid4()),
            "email": lenovo_email,
            "name": "Lenovo Syria",
            "phone": "0944444444",
            "role": "store_owner",
            "password_hash": password_hash,
            "created_at": "2025-01-20T00:00:00+00:00"
        }
        await db.users.insert_one(lenovo_user)
        print("✓ تم إنشاء حساب لينوفو")
        print(f"   📧 البريد: {lenovo_email}")
        print(f"   🔑 كلمة المرور: {lenovo_password}")
        
        # Create Lenovo store
        lenovo_store = {
            "id": str(uuid.uuid4()),
            "owner_id": lenovo_user['id'],
            "store_name": "متجر لينوفو الرسمي",
            "description": "متجر لينوفو الرسمي في سوريا - أجهزة كمبيوتر وإكسسوارات",
            "status": "approved",
            "logo": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200",
            "created_at": "2025-01-20T00:00:00+00:00"
        }
        await db.stores.insert_one(lenovo_store)
        print("✓ تم إنشاء متجر لينوفو (معتمد)")
        
        # Add Lenovo products
        electronics_cat = await db.categories.find_one({"slug": "electronics"})
        if electronics_cat:
            lenovo_products = [
                {
                    "id": str(uuid.uuid4()),
                    "store_id": lenovo_store['id'],
                    "category_id": electronics_cat['id'],
                    "name": "لابتوب Lenovo ThinkPad X1",
                    "description": "لابتوب احترافي بمعالج Intel Core i7، ذاكرة 16GB، SSD 512GB",
                    "price": 3500000,
                    "images": ["https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500"],
                    "stock": 15,
                    "status": "active",
                    "created_at": "2025-01-20T00:00:00+00:00"
                },
                {
                    "id": str(uuid.uuid4()),
                    "store_id": lenovo_store['id'],
                    "category_id": electronics_cat['id'],
                    "name": "لابتوب Lenovo IdeaPad",
                    "description": "لابتوب عملي بمعالج Intel Core i5، ذاكرة 8GB، SSD 256GB",
                    "price": 2200000,
                    "images": ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500"],
                    "stock": 25,
                    "status": "active",
                    "created_at": "2025-01-20T00:00:00+00:00"
                },
                {
                    "id": str(uuid.uuid4()),
                    "store_id": lenovo_store['id'],
                    "category_id": electronics_cat['id'],
                    "name": "Lenovo Legion Gaming Laptop",
                    "description": "لابتوب ألعاب قوي مع بطاقة RTX، معالج i9، ذاكرة 32GB",
                    "price": 5500000,
                    "images": ["https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500"],
                    "stock": 10,
                    "status": "active",
                    "created_at": "2025-01-20T00:00:00+00:00"
                }
            ]
            await db.products.insert_many(lenovo_products)
            print(f"✓ تمت إضافة {len(lenovo_products)} منتج للينوفو")
    else:
        print("✓ حساب لينوفو موجود مسبقاً")
        print(f"   📧 البريد: {lenovo_email}")
        print(f"   🔑 كلمة المرور: {lenovo_password}")
    
    # 3. Add Supermarket products
    print("\n" + "=" * 50)
    print("إضافة منتجات السوبر ماركت...")
    print("=" * 50)
    
    # Get default store
    store = await db.stores.find_one({"status": "approved"}, {"_id": 0})
    if store:
        supermarket_products = [
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": supermarket_cat['id'],
                "name": "أرز مصري فاخر - كيس 5 كغ",
                "description": "أرز مصري عالي الجودة، حبة طويلة",
                "price": 45000,
                "images": ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500"],
                "stock": 100,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": supermarket_cat['id'],
                "name": "زيت زيتون بكر - 1 لتر",
                "description": "زيت زيتون بكر ممتاز عصرة أولى",
                "price": 85000,
                "images": ["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500"],
                "stock": 60,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": supermarket_cat['id'],
                "name": "معكرونة إيطالية - عبوة 500غ",
                "description": "معكرونة إيطالية أصلية، نوعية ممتازة",
                "price": 12000,
                "images": ["https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500"],
                "stock": 150,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": supermarket_cat['id'],
                "name": "سكر أبيض ناعم - كيس 2 كغ",
                "description": "سكر أبيض ناعم عالي النقاوة",
                "price": 28000,
                "images": ["https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=500"],
                "stock": 80,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": supermarket_cat['id'],
                "name": "حليب طازج - علبة 1 لتر",
                "description": "حليب طازج كامل الدسم",
                "price": 15000,
                "images": ["https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500"],
                "stock": 120,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            }
        ]
        await db.products.insert_many(supermarket_products)
        print(f"✓ تمت إضافة {len(supermarket_products)} منتج للسوبر ماركت")
    
    client.close()
    
    print("\n" + "=" * 50)
    print("✅ اكتمل بنجاح!")
    print("=" * 50)
    print("\n📝 ملخص:")
    print(f"   • فئة سوبر ماركت: مضافة مع 5 منتجات")
    print(f"   • حساب لينوفو: {lenovo_email}")
    print(f"   • كلمة المرور: {lenovo_password}")
    print(f"   • متجر لينوفو: معتمد مع 3 منتجات")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(add_supermarket_and_lenovo())

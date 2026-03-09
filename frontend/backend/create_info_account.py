import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

async def create_info_account():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("=" * 50)
    print("إنشاء حساب Info...")
    print("=" * 50)
    
    info_email = "info@syriamarket.com"
    info_password = "Info@2025"
    
    # Check if exists
    existing = await db.users.find_one({"email": info_email})
    
    if existing:
        print("⚠️  حساب Info موجود مسبقاً")
        print(f"   📧 البريد: {info_email}")
        print(f"   🔑 كلمة المرور: {info_password}")
    else:
        # Create info account
        password_hash = bcrypt.hashpw(info_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        info_user = {
            "id": str(uuid.uuid4()),
            "email": info_email,
            "name": "متجر Info الرسمي",
            "phone": "0933333333",
            "role": "store_owner",
            "password_hash": password_hash,
            "created_at": "2025-01-20T00:00:00+00:00"
        }
        await db.users.insert_one(info_user)
        print("✓ تم إنشاء حساب Info")
        print(f"   📧 البريد: {info_email}")
        print(f"   🔑 كلمة المرور: {info_password}")
        
        # Create Info store
        info_store = {
            "id": str(uuid.uuid4()),
            "owner_id": info_user['id'],
            "store_name": "متجر Info للإلكترونيات",
            "description": "متجر Info الرسمي - أحدث الإلكترونيات والأجهزة الذكية",
            "status": "approved",
            "created_at": "2025-01-20T00:00:00+00:00"
        }
        await db.stores.insert_one(info_store)
        print("✓ تم إنشاء متجر Info (معتمد)")
        
        # Add Info products
        electronics_cat = await db.categories.find_one({"slug": "electronics"})
        if electronics_cat:
            info_products = [
                {
                    "id": str(uuid.uuid4()),
                    "store_id": info_store['id'],
                    "category_id": electronics_cat['id'],
                    "name": "سماعات AirPods Pro",
                    "description": "سماعات لاسلكية ذكية مع إلغاء الضوضاء",
                    "price": 450000,
                    "images": ["https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=500"],
                    "stock": 50,
                    "status": "active",
                    "created_at": "2025-01-20T00:00:00+00:00"
                },
                {
                    "id": str(uuid.uuid4()),
                    "store_id": info_store['id'],
                    "category_id": electronics_cat['id'],
                    "name": "تابلت iPad Air",
                    "description": "تابلت قوي بشاشة 10.9 إنش ومعالج M1",
                    "price": 2800000,
                    "images": ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500"],
                    "stock": 20,
                    "status": "active",
                    "created_at": "2025-01-20T00:00:00+00:00"
                }
            ]
            await db.products.insert_many(info_products)
            print(f"✓ تمت إضافة {len(info_products)} منتج لمتجر Info")
    
    client.close()
    print("\n" + "=" * 50)
    print("✅ اكتمل بنجاح!")
    print("=" * 50)
    print(f"\n📧 البريد: {info_email}")
    print(f"🔑 كلمة المرور: {info_password}")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(create_info_account())

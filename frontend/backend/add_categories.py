import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

async def add_new_categories():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # New categories to add
    new_categories = [
        {
            "id": str(uuid.uuid4()),
            "name_ar": "مطاعم وطعام",
            "name_en": "Restaurants & Food",
            "slug": "restaurants-food",
            "icon": "🍔"
        },
        {
            "id": str(uuid.uuid4()),
            "name_ar": "إلكترونيات",
            "name_en": "Electronics",
            "slug": "electronics",
            "icon": "📱"
        },
        {
            "id": str(uuid.uuid4()),
            "name_ar": "ماركات عالمية",
            "name_en": "International Brands",
            "slug": "brands",
            "icon": "⭐"
        }
    ]
    
    # Check and add categories
    for cat in new_categories:
        exists = await db.categories.find_one({"slug": cat["slug"]})
        if not exists:
            await db.categories.insert_one(cat)
            print(f"✓ تمت إضافة فئة: {cat['name_ar']}")
        else:
            print(f"✓ الفئة موجودة مسبقاً: {cat['name_ar']}")
    
    # Get store ID for sample products
    store = await db.stores.find_one({"status": "approved"}, {"_id": 0})
    if not store:
        print("✗ لا يوجد متجر معتمد لإضافة المنتجات")
        client.close()
        return
    
    # Sample product images
    sample_images = {
        "restaurants": [
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500",
            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500"
        ],
        "electronics": [
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
            "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=500"
        ],
        "brands": [
            "https://images.unsplash.com/photo-1523380677598-64d85d015339?w=500",
            "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500",
            "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=500"
        ]
    }
    
    # Get category IDs
    cats = await db.categories.find({}, {"_id": 0}).to_list(100)
    restaurants_cat = next((c for c in cats if c['slug'] == 'restaurants-food'), None)
    electronics_cat = next((c for c in cats if c['slug'] == 'electronics'), None)
    brands_cat = next((c for c in cats if c['slug'] == 'brands'), None)
    
    # Sample products for new categories
    sample_products = []
    
    if restaurants_cat:
        sample_products.extend([
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": restaurants_cat['id'],
                "name": "وجبة برغر مميزة",
                "description": "وجبة برغر لذيذة مع بطاطا مقلية ومشروب",
                "price": 35000,
                "images": [sample_images['restaurants'][0]],
                "stock": 100,
                "status": "active",
                "created_at": "2025-01-01T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": restaurants_cat['id'],
                "name": "بيتزا إيطالية أصلية",
                "description": "بيتزا طازجة بالجبنة والطماطم",
                "price": 45000,
                "images": [sample_images['restaurants'][1]],
                "stock": 50,
                "status": "active",
                "created_at": "2025-01-01T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": restaurants_cat['id'],
                "name": "سلطة صحية متنوعة",
                "description": "سلطة طازجة بالخضار والفواكه",
                "price": 25000,
                "images": [sample_images['restaurants'][2]],
                "stock": 80,
                "status": "active",
                "created_at": "2025-01-01T00:00:00+00:00"
            }
        ])
    
    if electronics_cat:
        sample_products.extend([
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": electronics_cat['id'],
                "name": "سماعات لاسلكية عالية الجودة",
                "description": "سماعات بلوتوث مع صوت نقي وبطارية طويلة",
                "price": 150000,
                "images": [sample_images['electronics'][0]],
                "stock": 30,
                "status": "active",
                "created_at": "2025-01-01T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": electronics_cat['id'],
                "name": "ساعة ذكية رياضية",
                "description": "ساعة ذكية مع متابعة اللياقة البدنية",
                "price": 250000,
                "images": [sample_images['electronics'][1]],
                "stock": 25,
                "status": "active",
                "created_at": "2025-01-01T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": electronics_cat['id'],
                "name": "كاميرا رقمية احترافية",
                "description": "كاميرا عالية الدقة للتصوير الاحترافي",
                "price": 800000,
                "images": [sample_images['electronics'][2]],
                "stock": 15,
                "status": "active",
                "created_at": "2025-01-01T00:00:00+00:00"
            }
        ])
    
    if brands_cat:
        sample_products.extend([
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": brands_cat['id'],
                "name": "ساعة يد فاخرة - ماركة عالمية",
                "description": "ساعة يد راقية من ماركة عالمية مشهورة",
                "price": 500000,
                "images": [sample_images['brands'][0]],
                "stock": 10,
                "status": "active",
                "created_at": "2025-01-01T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": brands_cat['id'],
                "name": "نظارات شمسية - ماركة أصلية",
                "description": "نظارات شمسية أنيقة من ماركة عالمية",
                "price": 180000,
                "images": [sample_images['brands'][1]],
                "stock": 20,
                "status": "active",
                "created_at": "2025-01-01T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": brands_cat['id'],
                "name": "عطر رجالي فاخر",
                "description": "عطر راقي من ماركة عالمية مميزة",
                "price": 320000,
                "images": [sample_images['brands'][2]],
                "stock": 35,
                "status": "active",
                "created_at": "2025-01-01T00:00:00+00:00"
            }
        ])
    
    if sample_products:
        await db.products.insert_many(sample_products)
        print(f"✓ تمت إضافة {len(sample_products)} منتج جديد")
    
    client.close()
    print("\n✅ تم إضافة الفئات والمنتجات بنجاح!")

if __name__ == "__main__":
    asyncio.run(add_new_categories())

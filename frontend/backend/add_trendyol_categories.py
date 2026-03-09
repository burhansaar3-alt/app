import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def add_missing_categories():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("=" * 60)
    print("إضافة الفئات الناقصة من Trendyol...")
    print("=" * 60)
    
    # New categories from Trendyol
    new_categories = [
        {
            "id": str(uuid.uuid4()),
            "name_ar": "أزياء أطفال",
            "name_en": "Kids Fashion",
            "slug": "kids-fashion",
            "icon": "👶"
        },
        {
            "id": str(uuid.uuid4()),
            "name_ar": "مستحضرات التجميل",
            "name_en": "Beauty & Personal Care",
            "slug": "beauty-care",
            "icon": "💄"
        },
        {
            "id": str(uuid.uuid4()),
            "name_ar": "الصحة والعافية",
            "name_en": "Health & Wellness",
            "slug": "health-wellness",
            "icon": "🏥"
        },
        {
            "id": str(uuid.uuid4()),
            "name_ar": "مستلزمات الأطفال",
            "name_en": "Baby Care",
            "slug": "baby-care",
            "icon": "🍼"
        },
        {
            "id": str(uuid.uuid4()),
            "name_ar": "الرياضة واللياقة",
            "name_en": "Sports & Fitness",
            "slug": "sports-fitness",
            "icon": "⚽"
        },
        {
            "id": str(uuid.uuid4()),
            "name_ar": "مستلزمات الحيوانات",
            "name_en": "Pet Supplies",
            "slug": "pet-supplies",
            "icon": "🐾"
        },
        {
            "id": str(uuid.uuid4()),
            "name_ar": "الكتب والقرطاسية",
            "name_en": "Books & Stationery",
            "slug": "books-stationery",
            "icon": "📚"
        },
        {
            "id": str(uuid.uuid4()),
            "name_ar": "الأثاث والديكور",
            "name_en": "Furniture & Decor",
            "slug": "furniture-decor",
            "icon": "🛋️"
        }
    ]
    
    added_categories = []
    for cat in new_categories:
        exists = await db.categories.find_one({"slug": cat["slug"]})
        if not exists:
            await db.categories.insert_one(cat)
            added_categories.append(cat)
            print(f"✓ تمت إضافة: {cat['name_ar']}")
        else:
            print(f"⚠️  موجودة مسبقاً: {cat['name_ar']}")
    
    # Get default store for sample products
    store = await db.stores.find_one({"status": "approved"}, {"_id": 0})
    if not store:
        print("\n✗ لا يوجد متجر معتمد لإضافة المنتجات")
        client.close()
        return
    
    # Sample products for new categories
    sample_products = []
    
    # Kids Fashion
    kids_cat = next((c for c in added_categories if c['slug'] == 'kids-fashion'), None)
    if kids_cat:
        sample_products.extend([
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": kids_cat['id'],
                "name": "فستان أطفال صيفي",
                "description": "فستان جميل ومريح للأطفال",
                "price": 45000,
                "images": ["https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=500"],
                "stock": 50,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": kids_cat['id'],
                "name": "تيشيرت أطفال كارتون",
                "description": "تيشيرت قطني برسومات كرتونية",
                "price": 25000,
                "images": ["https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=500"],
                "stock": 80,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            }
        ])
    
    # Beauty & Care
    beauty_cat = next((c for c in added_categories if c['slug'] == 'beauty-care'), None)
    if beauty_cat:
        sample_products.extend([
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": beauty_cat['id'],
                "name": "كريم مرطب للبشرة",
                "description": "كريم مرطب طبيعي لجميع أنواع البشرة",
                "price": 65000,
                "images": ["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500"],
                "stock": 40,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": beauty_cat['id'],
                "name": "مجموعة مكياج كاملة",
                "description": "مجموعة مكياج متكاملة بألوان عصرية",
                "price": 120000,
                "images": ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500"],
                "stock": 25,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            }
        ])
    
    # Health & Wellness
    health_cat = next((c for c in added_categories if c['slug'] == 'health-wellness'), None)
    if health_cat:
        sample_products.extend([
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": health_cat['id'],
                "name": "فيتامينات متعددة",
                "description": "مكمل غذائي بالفيتامينات الأساسية",
                "price": 75000,
                "images": ["https://images.unsplash.com/photo-1550572017-4733e072ea5a?w=500"],
                "stock": 60,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            }
        ])
    
    # Baby Care
    baby_cat = next((c for c in added_categories if c['slug'] == 'baby-care'), None)
    if baby_cat:
        sample_products.extend([
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": baby_cat['id'],
                "name": "حفاضات أطفال - عبوة كبيرة",
                "description": "حفاضات عالية الجودة وآمنة للأطفال",
                "price": 95000,
                "images": ["https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500"],
                "stock": 100,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": baby_cat['id'],
                "name": "زجاجة رضاعة مضادة للمغص",
                "description": "زجاجة رضاعة طبية آمنة",
                "price": 35000,
                "images": ["https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=500"],
                "stock": 70,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            }
        ])
    
    # Sports & Fitness
    sports_cat = next((c for c in added_categories if c['slug'] == 'sports-fitness'), None)
    if sports_cat:
        sample_products.extend([
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": sports_cat['id'],
                "name": "دامبل قابل للتعديل",
                "description": "دامبل رياضي قابل لتعديل الوزن",
                "price": 180000,
                "images": ["https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500"],
                "stock": 30,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": sports_cat['id'],
                "name": "سجادة يوغا احترافية",
                "description": "سجادة يوغا مضادة للانزلاق",
                "price": 55000,
                "images": ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500"],
                "stock": 45,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            }
        ])
    
    # Pet Supplies
    pet_cat = next((c for c in added_categories if c['slug'] == 'pet-supplies'), None)
    if pet_cat:
        sample_products.extend([
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": pet_cat['id'],
                "name": "طعام قطط فاخر - 5 كغ",
                "description": "طعام صحي ومتوازن للقطط",
                "price": 85000,
                "images": ["https://images.unsplash.com/photo-1589883661923-6476cb0ae9f2?w=500"],
                "stock": 50,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            }
        ])
    
    # Books & Stationery
    books_cat = next((c for c in added_categories if c['slug'] == 'books-stationery'), None)
    if books_cat:
        sample_products.extend([
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": books_cat['id'],
                "name": "دفتر ملاحظات فاخر",
                "description": "دفتر أنيق بغلاف جلدي",
                "price": 35000,
                "images": ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500"],
                "stock": 90,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            }
        ])
    
    # Furniture & Decor
    furniture_cat = next((c for c in added_categories if c['slug'] == 'furniture-decor'), None)
    if furniture_cat:
        sample_products.extend([
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": furniture_cat['id'],
                "name": "كرسي مكتب مريح",
                "description": "كرسي مكتب بتصميم ergonomic",
                "price": 450000,
                "images": ["https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=500"],
                "stock": 15,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            },
            {
                "id": str(uuid.uuid4()),
                "store_id": store['id'],
                "category_id": furniture_cat['id'],
                "name": "مصباح طاولة عصري",
                "description": "مصباح LED بتصميم عصري",
                "price": 75000,
                "images": ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500"],
                "stock": 40,
                "status": "active",
                "created_at": "2025-01-20T00:00:00+00:00"
            }
        ])
    
    if sample_products:
        await db.products.insert_many(sample_products)
        print(f"\n✓ تمت إضافة {len(sample_products)} منتج جديد")
    
    # Final count
    total_cats = await db.categories.count_documents({})
    total_products = await db.products.count_documents({})
    
    client.close()
    
    print("\n" + "=" * 60)
    print("✅ اكتمل بنجاح!")
    print("=" * 60)
    print(f"\n📊 الإحصائيات:")
    print(f"   • عدد الفئات الكلي: {total_cats}")
    print(f"   • عدد المنتجات الكلي: {total_products}")
    print(f"   • الفئات المضافة: {len(added_categories)}")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(add_missing_categories())

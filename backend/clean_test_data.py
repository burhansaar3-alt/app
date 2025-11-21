import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def clean_test_products():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("=== جاري حذف المنتجات التجريبية ===\n")
    
    # Get all products
    all_products = await db.products.find({}, {"_id": 0}).to_list(1000)
    print(f"عدد المنتجات الحالية: {len(all_products)}")
    
    # Delete test products (from Test Store)
    test_store = await db.stores.find_one({"store_name": "Test Store"}, {"_id": 0})
    if test_store:
        result = await db.products.delete_many({"store_id": test_store['id']})
        print(f"✓ تم حذف {result.deleted_count} منتج من متجر Test Store")
        
        # Delete the Test Store itself
        await db.stores.delete_one({"id": test_store['id']})
        print(f"✓ تم حذف متجر Test Store")
    else:
        print("⚠️  متجر Test Store غير موجود")
    
    # Get remaining products
    remaining = await db.products.find({}, {"_id": 0}).to_list(1000)
    print(f"\nعدد المنتجات المتبقية: {len(remaining)}")
    
    # Show remaining stores
    stores = await db.stores.find({"status": "approved"}, {"_id": 0}).to_list(100)
    print(f"\nالمتاجر المعتمدة المتبقية:")
    for store in stores:
        count = await db.products.count_documents({"store_id": store['id']})
        print(f"  - {store['store_name']}: {count} منتج")
    
    client.close()
    print("\n✅ تم التنظيف بنجاح!")

if __name__ == "__main__":
    asyncio.run(clean_test_products())

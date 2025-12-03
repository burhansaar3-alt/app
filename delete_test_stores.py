#!/usr/bin/env python3
"""
سكريبت لحذف المتاجر التجريبية
يمكن تشغيله من لوحة الأدمن أو يدوياً
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path('/app/backend/.env'))

async def delete_test_stores():
    """حذف المتاجر التجريبية"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔍 البحث عن المتاجر التجريبية...")
    
    # ابحث عن المتاجر التي تبدأ بـ "Test" أو تحتوي على "تجريب" أو "test"
    test_stores = await db.stores.find({
        '$or': [
            {'store_name': {'$regex': 'test', '$options': 'i'}},
            {'store_name': {'$regex': 'تجريب', '$options': 'i'}},
            {'store_name': {'$regex': 'demo', '$options': 'i'}},
        ]
    }, {'_id': 0}).to_list(100)
    
    if not test_stores:
        print("✅ لا توجد متاجر تجريبية للحذف")
        return
    
    print(f"\n📊 تم العثور على {len(test_stores)} متجر تجريبي:")
    for store in test_stores:
        print(f"  - {store['store_name']} (ID: {store['id']})")
    
    # اسأل المستخدم للتأكيد
    confirm = input(f"\n⚠️  هل تريد حذف هذه المتاجر وجميع منتجاتها؟ (yes/no): ")
    
    if confirm.lower() not in ['yes', 'y', 'نعم']:
        print("❌ تم الإلغاء")
        return
    
    print("\n🗑️  جاري الحذف...")
    
    total_products_deleted = 0
    for store in test_stores:
        store_id = store['id']
        store_name = store['store_name']
        
        # حذف منتجات المتجر
        products_result = await db.products.delete_many({'store_id': store_id})
        products_deleted = products_result.deleted_count
        total_products_deleted += products_deleted
        
        # حذف المتجر
        await db.stores.delete_one({'id': store_id})
        
        print(f"✅ تم حذف: {store_name} ({products_deleted} منتج)")
    
    print(f"\n🎉 تم الحذف بنجاح!")
    print(f"   المتاجر المحذوفة: {len(test_stores)}")
    print(f"   المنتجات المحذوفة: {total_products_deleted}")

if __name__ == "__main__":
    asyncio.run(delete_test_stores())

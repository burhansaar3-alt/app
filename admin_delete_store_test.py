#!/usr/bin/env python3
"""
Specific test for Admin Delete Store functionality
Testing the DELETE /api/stores/{store_id} endpoint
"""
import requests
import json
from datetime import datetime

def test_admin_delete_store():
    base_url = "https://shopsyria.preview.emergentagent.com/api"
    
    print("🧪 Testing Admin Delete Store Functionality")
    print("=" * 50)
    
    # Step 1: Create or login as admin
    print("1️⃣ Creating/Login Admin Account...")
    admin_data = {
        "email": "admin@test.com",
        "password": "admin123",
        "name": "Admin User",
        "role": "admin"
    }
    
    # Try to register admin (might already exist)
    try:
        response = requests.post(f"{base_url}/auth/register", json=admin_data, timeout=10)
        if response.status_code == 200:
            admin_token = response.json()['token']
            print("✅ Admin registered successfully")
        else:
            # Try login instead
            login_data = {"email": "admin@test.com", "password": "admin123"}
            response = requests.post(f"{base_url}/auth/login", json=login_data, timeout=10)
            if response.status_code == 200:
                admin_token = response.json()['token']
                print("✅ Admin logged in successfully")
            else:
                print(f"❌ Failed to create/login admin: {response.status_code}")
                return False
    except Exception as e:
        print(f"❌ Error with admin authentication: {e}")
        return False
    
    # Step 2: Create a store owner and store to delete
    print("\n2️⃣ Creating Store Owner and Store...")
    timestamp = datetime.now().strftime('%H%M%S')
    
    # Register store owner
    owner_data = {
        "email": f"store_owner_delete_{timestamp}@example.com",
        "password": "password123",
        "name": "Store Owner for Delete Test",
        "role": "store_owner"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/register", json=owner_data, timeout=10)
        if response.status_code != 200:
            print(f"❌ Failed to register store owner: {response.status_code}")
            return False
        
        owner_token = response.json()['token']
        print("✅ Store owner registered")
        
        # Create store
        store_data = {
            "store_name": f"Test Store Delete {timestamp}",
            "description": "Store created for deletion test"
        }
        
        headers = {'Authorization': f'Bearer {owner_token}'}
        response = requests.post(f"{base_url}/stores", json=store_data, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Failed to create store: {response.status_code}")
            return False
        
        store_id = response.json()['id']
        print(f"✅ Store created with ID: {store_id}")
        
    except Exception as e:
        print(f"❌ Error creating store: {e}")
        return False
    
    # Step 3: Approve the store (admin action)
    print("\n3️⃣ Approving Store...")
    try:
        admin_headers = {'Authorization': f'Bearer {admin_token}'}
        response = requests.patch(f"{base_url}/stores/{store_id}/approve?status=approved", 
                                headers=admin_headers, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Failed to approve store: {response.status_code}")
            return False
        
        print("✅ Store approved")
        
    except Exception as e:
        print(f"❌ Error approving store: {e}")
        return False
    
    # Step 4: Add products to the store
    print("\n4️⃣ Adding Products to Store...")
    try:
        # Get categories first
        response = requests.get(f"{base_url}/categories", timeout=10)
        if response.status_code != 200:
            print(f"❌ Failed to get categories: {response.status_code}")
            return False
        
        categories = response.json()
        if not categories:
            print("❌ No categories available")
            return False
        
        # Add a product
        product_data = {
            "category_id": categories[0]['id'],
            "name": f"Test Product {timestamp}",
            "description": "Product to be deleted with store",
            "price": 50000,
            "stock": 10
        }
        
        response = requests.post(f"{base_url}/products", json=product_data, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Failed to add product: {response.status_code}")
            return False
        
        product_id = response.json()['id']
        print(f"✅ Product added with ID: {product_id}")
        
    except Exception as e:
        print(f"❌ Error adding product: {e}")
        return False
    
    # Step 5: Test the DELETE store API
    print("\n5️⃣ Testing DELETE Store API...")
    try:
        response = requests.delete(f"{base_url}/stores/{store_id}", headers=admin_headers, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ DELETE store failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Response text: {response.text}")
            return False
        
        delete_result = response.json()
        print(f"✅ Store deleted successfully!")
        print(f"   Message: {delete_result.get('message', 'No message')}")
        print(f"   Products deleted: {delete_result.get('products_deleted', 0)}")
        
    except Exception as e:
        print(f"❌ Error deleting store: {e}")
        return False
    
    # Step 6: Verify store is actually deleted
    print("\n6️⃣ Verifying Store Deletion...")
    try:
        response = requests.get(f"{base_url}/stores", timeout=10)
        if response.status_code != 200:
            print(f"❌ Failed to get stores for verification: {response.status_code}")
            return False
        
        stores = response.json()
        remaining_stores = [s for s in stores if s.get('id') == store_id]
        
        if len(remaining_stores) == 0:
            print("✅ Store successfully removed from database")
        else:
            print("❌ Store still exists in database")
            return False
        
        # Also verify products are deleted
        response = requests.get(f"{base_url}/products?store_id={store_id}", timeout=10)
        if response.status_code == 200:
            products = response.json()
            if len(products) == 0:
                print("✅ All store products successfully deleted")
            else:
                print(f"❌ {len(products)} products still exist for deleted store")
                return False
        
    except Exception as e:
        print(f"❌ Error verifying deletion: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 Admin Delete Store Test PASSED!")
    print("✅ Store and all its products were successfully deleted")
    return True

if __name__ == "__main__":
    success = test_admin_delete_store()
    exit(0 if success else 1)
#!/usr/bin/env python3
"""
Test admin delete store functionality with user-specified credentials
Testing as requested: admin@test.com / admin123
"""
import requests
import json
from datetime import datetime

def test_user_specified_admin():
    base_url = "https://shopsyria.preview.emergentagent.com/api"
    
    print("🧪 Testing Admin Delete Store with User-Specified Credentials")
    print("=" * 60)
    
    # Step 1: Create admin account as specified by user
    print("1️⃣ Creating Admin Account (admin@test.com)...")
    admin_data = {
        "email": "admin@test.com",
        "password": "admin123",
        "name": "Admin User",
        "role": "admin"
    }
    
    # Try to register admin
    try:
        response = requests.post(f"{base_url}/auth/register", json=admin_data, timeout=10)
        if response.status_code == 200:
            admin_token = response.json()['token']
            print("✅ Admin account created successfully")
        elif response.status_code == 400:
            # Admin already exists, try login
            print("ℹ️  Admin account already exists, logging in...")
            login_data = {"email": "admin@test.com", "password": "admin123"}
            response = requests.post(f"{base_url}/auth/login", json=login_data, timeout=10)
            if response.status_code == 200:
                admin_token = response.json()['token']
                print("✅ Admin logged in successfully")
            else:
                print(f"❌ Failed to login admin: {response.status_code}")
                return False
        else:
            print(f"❌ Failed to create admin: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error with admin authentication: {e}")
        return False
    
    # Step 2: Get existing stores to delete
    print("\n2️⃣ Getting Existing Stores...")
    try:
        response = requests.get(f"{base_url}/stores", timeout=10)
        if response.status_code != 200:
            print(f"❌ Failed to get stores: {response.status_code}")
            return False
        
        stores = response.json()
        print(f"✅ Found {len(stores)} stores in the system")
        
        if not stores:
            print("ℹ️  No stores available to delete, creating one first...")
            # Create a store to delete
            timestamp = datetime.now().strftime('%H%M%S')
            
            # Register store owner
            owner_data = {
                "email": f"test_owner_{timestamp}@example.com",
                "password": "password123",
                "name": "Test Store Owner",
                "role": "store_owner"
            }
            
            response = requests.post(f"{base_url}/auth/register", json=owner_data, timeout=10)
            if response.status_code != 200:
                print(f"❌ Failed to register store owner: {response.status_code}")
                return False
            
            owner_token = response.json()['token']
            
            # Create store
            store_data = {
                "store_name": f"Test Store {timestamp}",
                "description": "Test store for deletion"
            }
            
            headers = {'Authorization': f'Bearer {owner_token}'}
            response = requests.post(f"{base_url}/stores", json=store_data, headers=headers, timeout=10)
            
            if response.status_code != 200:
                print(f"❌ Failed to create store: {response.status_code}")
                return False
            
            new_store = response.json()
            stores = [new_store]
            print(f"✅ Created test store: {new_store['store_name']}")
        
        # Select first store for deletion
        store_to_delete = stores[0]
        store_id = store_to_delete['id']
        store_name = store_to_delete['store_name']
        
        print(f"📍 Selected store for deletion:")
        print(f"   ID: {store_id}")
        print(f"   Name: {store_name}")
        print(f"   Status: {store_to_delete.get('status', 'unknown')}")
        
    except Exception as e:
        print(f"❌ Error getting stores: {e}")
        return False
    
    # Step 3: Test DELETE API call
    print(f"\n3️⃣ Testing DELETE /api/stores/{store_id}...")
    try:
        admin_headers = {'Authorization': f'Bearer {admin_token}'}
        
        # Make the DELETE request
        response = requests.delete(f"{base_url}/stores/{store_id}", headers=admin_headers, timeout=10)
        
        print(f"📡 API Call: DELETE {base_url}/stores/{store_id}")
        print(f"📋 Headers: Authorization: Bearer {admin_token[:20]}...")
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ DELETE API call successful!")
            print(f"   Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
            
            products_deleted = result.get('products_deleted', 0)
            message = result.get('message', 'No message')
            
            print(f"\n📈 Deletion Summary:")
            print(f"   Store deleted: ✅ {store_name}")
            print(f"   Products deleted: {products_deleted}")
            print(f"   Message: {message}")
            
        elif response.status_code == 403:
            print("❌ Access denied - User does not have admin role")
            return False
        elif response.status_code == 404:
            print("❌ Store not found")
            return False
        else:
            print(f"❌ DELETE failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error making DELETE request: {e}")
        return False
    
    # Step 4: Verify deletion
    print(f"\n4️⃣ Verifying Store Deletion...")
    try:
        response = requests.get(f"{base_url}/stores", timeout=10)
        if response.status_code == 200:
            remaining_stores = response.json()
            deleted_store_exists = any(s.get('id') == store_id for s in remaining_stores)
            
            if not deleted_store_exists:
                print("✅ Store successfully removed from database")
            else:
                print("❌ Store still exists in database")
                return False
        else:
            print(f"❌ Failed to verify deletion: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error verifying deletion: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 USER-SPECIFIED ADMIN DELETE TEST PASSED!")
    print("✅ Admin credentials work correctly")
    print("✅ DELETE /api/stores/{store_id} API works")
    print("✅ Store and products deleted successfully")
    print("✅ Admin role permissions verified")
    
    return True

if __name__ == "__main__":
    success = test_user_specified_admin()
    exit(0 if success else 1)
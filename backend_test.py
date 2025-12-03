#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

class SyriaMarketAPITester:
    def __init__(self, base_url="https://trendyol-clone-41.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.store_owner_token = None
        self.customer_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "status": "PASS" if success else "FAIL",
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status_icon = "✅" if success else "❌"
        print(f"{status_icon} {name}: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, {}
            return False, {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health"""
        return self.run_test("API Health Check", "GET", "", 200)

    def test_register_admin(self):
        """Register admin user"""
        admin_data = {
            "email": "admin@syriamarket.com",
            "password": "admin123",
            "name": "Admin User",
            "role": "admin"
        }
        success, response = self.run_test("Register Admin", "POST", "auth/register", 200, admin_data)
        if success and 'token' in response:
            self.admin_token = response['token']
        return success

    def test_register_store_owner(self):
        """Register store owner"""
        timestamp = datetime.now().strftime('%H%M%S')
        owner_data = {
            "email": f"store_owner_{timestamp}@example.com",
            "password": "password123",
            "name": "Store Owner",
            "phone": "0912345678",
            "role": "store_owner"
        }
        success, response = self.run_test("Register Store Owner", "POST", "auth/register", 200, owner_data)
        if success and 'token' in response:
            self.store_owner_token = response['token']
        return success

    def test_register_customer(self):
        """Register customer"""
        timestamp = datetime.now().strftime('%H%M%S')
        customer_data = {
            "email": f"customer_{timestamp}@example.com",
            "password": "password123",
            "name": "Test Customer",
            "phone": "0987654321",
            "role": "customer"
        }
        success, response = self.run_test("Register Customer", "POST", "auth/register", 200, customer_data)
        if success and 'token' in response:
            self.customer_token = response['token']
        return success

    def test_login_admin(self):
        """Test admin login"""
        login_data = {
            "email": "admin@syriamarket.com",
            "password": "admin123"
        }
        success, response = self.run_test("Admin Login", "POST", "auth/login", 200, login_data)
        if success and 'token' in response:
            self.admin_token = response['token']
        return success

    def test_get_categories(self):
        """Test getting categories"""
        return self.run_test("Get Categories", "GET", "categories", 200)

    def test_get_products(self):
        """Test getting products"""
        return self.run_test("Get Products", "GET", "products", 200)

    def test_create_store(self):
        """Test creating a store"""
        if not self.store_owner_token:
            self.log_test("Create Store", False, "No store owner token")
            return False
        
        store_data = {
            "store_name": "Test Store",
            "description": "A test store for testing purposes"
        }
        headers = {'Authorization': f'Bearer {self.store_owner_token}'}
        return self.run_test("Create Store", "POST", "stores", 200, store_data, headers)

    def test_get_stores(self):
        """Test getting stores"""
        return self.run_test("Get Stores", "GET", "stores", 200)

    def test_approve_store(self):
        """Test approving a store (admin only)"""
        if not self.admin_token:
            self.log_test("Approve Store", False, "No admin token")
            return False
        
        # First get stores to find one to approve
        success, stores_data = self.run_test("Get Stores for Approval", "GET", "stores", 200)
        if not success or not stores_data:
            return False
        
        pending_stores = [s for s in stores_data if s.get('status') == 'pending']
        if not pending_stores:
            self.log_test("Approve Store", False, "No pending stores to approve")
            return False
        
        store_id = pending_stores[0]['id']
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        return self.run_test("Approve Store", "PATCH", f"stores/{store_id}/approve?status=approved", 200, None, headers)

    def test_add_product(self):
        """Test adding a product"""
        if not self.store_owner_token:
            self.log_test("Add Product", False, "No store owner token")
            return False
        
        # First get categories
        success, categories = self.run_test("Get Categories for Product", "GET", "categories", 200)
        if not success or not categories:
            return False
        
        product_data = {
            "category_id": categories[0]['id'],
            "name": "Test Product",
            "description": "A test product",
            "price": 50000,
            "stock": 10,
            "images": ["https://via.placeholder.com/300"]
        }
        headers = {'Authorization': f'Bearer {self.store_owner_token}'}
        return self.run_test("Add Product", "POST", "products", 200, product_data, headers)

    def test_cart_operations(self):
        """Test cart operations"""
        if not self.customer_token:
            self.log_test("Cart Operations", False, "No customer token")
            return False
        
        headers = {'Authorization': f'Bearer {self.customer_token}'}
        
        # Get cart (should be empty initially)
        success, _ = self.run_test("Get Empty Cart", "GET", "cart", 200, None, headers)
        if not success:
            return False
        
        # Get products to add to cart
        success, products = self.run_test("Get Products for Cart", "GET", "products", 200)
        if not success or not products:
            return False
        
        if products:
            product_id = products[0]['id']
            cart_item = {"product_id": product_id, "quantity": 2}
            success, _ = self.run_test("Add to Cart", "POST", "cart/add", 200, cart_item, headers)
            if not success:
                return False
            
            # Get cart with items
            success, _ = self.run_test("Get Cart with Items", "GET", "cart", 200, None, headers)
            return success
        
        return True

    def test_create_order(self):
        """Test creating an order"""
        if not self.customer_token:
            self.log_test("Create Order", False, "No customer token")
            return False
        
        order_data = {
            "shipping_address": "Damascus, Syria, Test Street 123",
            "phone": "0987654321"
        }
        headers = {'Authorization': f'Bearer {self.customer_token}'}
        return self.run_test("Create Order", "POST", "orders", 200, order_data, headers)

    def test_get_orders(self):
        """Test getting orders"""
        if not self.customer_token:
            self.log_test("Get Customer Orders", False, "No customer token")
            return False
        
        headers = {'Authorization': f'Bearer {self.customer_token}'}
        success, _ = self.run_test("Get Customer Orders", "GET", "orders/my", 200, None, headers)
        
        if self.admin_token:
            admin_headers = {'Authorization': f'Bearer {self.admin_token}'}
            admin_success, _ = self.run_test("Get All Orders (Admin)", "GET", "orders", 200, None, admin_headers)
            return success and admin_success
        
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Syria Market API Tests...")
        print("=" * 50)
        
        # Basic tests
        self.test_health_check()
        self.test_get_categories()
        self.test_get_products()
        
        # Authentication tests
        self.test_register_admin()
        self.test_register_store_owner()
        self.test_register_customer()
        self.test_login_admin()
        
        # Store management tests
        self.test_create_store()
        self.test_get_stores()
        self.test_approve_store()
        
        # Product tests
        self.test_add_product()
        
        # Shopping flow tests
        self.test_cart_operations()
        self.test_create_order()
        self.test_get_orders()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = SyriaMarketAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w', encoding='utf-8') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
                'timestamp': datetime.now().isoformat()
            },
            'detailed_results': tester.test_results
        }, f, indent=2, ensure_ascii=False)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
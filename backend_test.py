#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

class SyriaMarketAPITester:
    def __init__(self, base_url="https://shopsyria.preview.emergentagent.com/api"):
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
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
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

    def test_admin_delete_store(self):
        """Test admin delete store functionality"""
        if not self.admin_token:
            self.log_test("Admin Delete Store", False, "No admin token")
            return False
        
        # First, create a store owner and store to delete
        timestamp = datetime.now().strftime('%H%M%S')
        owner_data = {
            "email": f"delete_test_owner_{timestamp}@example.com",
            "password": "password123",
            "name": "Delete Test Owner",
            "role": "store_owner"
        }
        
        # Register store owner
        success, response = self.run_test("Register Store Owner for Delete Test", "POST", "auth/register", 200, owner_data)
        if not success or 'token' not in response:
            return False
        
        temp_owner_token = response['token']
        
        # Create a store
        store_data = {
            "store_name": f"Test Store to Delete {timestamp}",
            "description": "This store will be deleted in the test"
        }
        headers = {'Authorization': f'Bearer {temp_owner_token}'}
        success, store_response = self.run_test("Create Store for Delete Test", "POST", "stores", 200, store_data, headers)
        if not success or 'id' not in store_response:
            return False
        
        store_id = store_response['id']
        
        # Approve the store first (admin action)
        admin_headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, _ = self.run_test("Approve Store for Delete Test", "PATCH", f"stores/{store_id}/approve?status=approved", 200, None, admin_headers)
        if not success:
            return False
        
        # Add a product to the store to test cascade deletion
        # First get categories
        success, categories = self.run_test("Get Categories for Delete Test", "GET", "categories", 200)
        if success and categories:
            product_data = {
                "category_id": categories[0]['id'],
                "name": f"Test Product for Delete {timestamp}",
                "description": "This product will be deleted with the store",
                "price": 25000,
                "stock": 5
            }
            success, _ = self.run_test("Add Product for Delete Test", "POST", "products", 200, product_data, headers)
        
        # Now test the actual delete functionality
        success, delete_response = self.run_test("Admin Delete Store", "DELETE", f"stores/{store_id}", 200, None, admin_headers)
        
        if success:
            # Verify the store is actually deleted
            success_verify, _ = self.run_test("Verify Store Deleted", "GET", f"stores", 200)
            if success_verify:
                # Check that the deleted store is not in the list
                success_get_stores, stores_data = self.run_test("Get Stores After Delete", "GET", "stores", 200)
                if success_get_stores:
                    remaining_stores = [s for s in stores_data if s.get('id') == store_id]
                    if len(remaining_stores) == 0:
                        self.log_test("Verify Store Deletion", True, "Store successfully removed from database")
                        return True
                    else:
                        self.log_test("Verify Store Deletion", False, "Store still exists in database")
                        return False
        
        return success

    def test_login_existing_admin(self):
        """Test login with existing admin credentials"""
        login_data = {
            "email": "trendsyria926@gmail.com",
            "password": "admin123"
        }
        success, response = self.run_test("Login Existing Admin", "POST", "auth/login", 200, login_data)
        if success and 'token' in response:
            self.admin_token = response['token']
        return success

    def test_store_orders_api(self):
        """Test GET /api/orders/store endpoint for store owners"""
        if not self.store_owner_token:
            self.log_test("Store Orders API", False, "No store owner token")
            return False
        
        headers = {'Authorization': f'Bearer {self.store_owner_token}'}
        return self.run_test("Get Store Orders", "GET", "orders/store", 200, None, headers)

    def test_update_order_status_admin(self):
        """Test PATCH /api/orders/{order_id}/status with admin token"""
        if not self.admin_token:
            self.log_test("Update Order Status (Admin)", False, "No admin token")
            return False
        
        # First get all orders to find one to update
        admin_headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, orders_data = self.run_test("Get Orders for Status Update", "GET", "orders", 200, None, admin_headers)
        
        if not success or not orders_data:
            self.log_test("Update Order Status (Admin)", False, "No orders found to update")
            return False
        
        if orders_data:
            order_id = orders_data[0]['id']
            # Test updating order status to 'confirmed'
            return self.run_test("Update Order Status (Admin)", "PATCH", f"orders/{order_id}/status?status=confirmed", 200, None, admin_headers)
        
        return False

    def test_update_order_status_store_owner(self):
        """Test PATCH /api/orders/{order_id}/status with store owner token"""
        if not self.store_owner_token:
            self.log_test("Update Order Status (Store Owner)", False, "No store owner token")
            return False
        
        headers = {'Authorization': f'Bearer {self.store_owner_token}'}
        
        # First, let's create an order with products from our store
        # Get our store products
        success, products_data = self.run_test("Get Products for Store Owner Order", "GET", "products", 200)
        if not success or not products_data:
            self.log_test("Update Order Status (Store Owner)", False, "No products found")
            return False
        
        # Get our store
        success, stores_data = self.run_test("Get My Stores for Order Test", "GET", "stores/my", 200, None, headers)
        if not success or not stores_data:
            self.log_test("Update Order Status (Store Owner)", False, "No stores found")
            return False
        
        our_store_id = stores_data[0]['id']
        our_products = [p for p in products_data if p.get('store_id') == our_store_id]
        
        if not our_products:
            self.log_test("Update Order Status (Store Owner)", False, "No products from our store")
            return False
        
        # Create a customer order with our product
        if not self.customer_token:
            self.log_test("Update Order Status (Store Owner)", False, "No customer token for order creation")
            return False
        
        customer_headers = {'Authorization': f'Bearer {self.customer_token}'}
        
        # Add our product to customer cart
        product_id = our_products[0]['id']
        cart_item = {"product_id": product_id, "quantity": 1}
        success, _ = self.run_test("Add Store Product to Cart", "POST", "cart/add", 200, cart_item, customer_headers)
        if not success:
            return False
        
        # Create order
        order_data = {
            "shipping_address": "دمشق، سوريا، شارع المتجر 456",
            "phone": "0987654321",
            "payment_method": "cash_on_delivery"
        }
        success, order_response = self.run_test("Create Order for Store Owner Test", "POST", "orders", 200, order_data, customer_headers)
        if not success or 'id' not in order_response:
            return False
        
        order_id = order_response['id']
        
        # Now test updating order status as store owner
        return self.run_test("Update Order Status (Store Owner)", "PATCH", f"orders/{order_id}/status?status=shipped", 200, None, headers)

    def test_update_product_put(self):
        """Test PUT /api/products/{product_id} endpoint"""
        if not self.store_owner_token:
            self.log_test("Update Product (PUT)", False, "No store owner token")
            return False
        
        # First get products to find one to update
        success, products_data = self.run_test("Get Products for PUT Update", "GET", "products", 200)
        
        if not success or not products_data:
            self.log_test("Update Product (PUT)", False, "No products found to update")
            return False
        
        # Find a product from our store
        headers = {'Authorization': f'Bearer {self.store_owner_token}'}
        
        # Get our store first
        success, stores_data = self.run_test("Get My Stores for Product Update", "GET", "stores/my", 200, None, headers)
        if not success or not stores_data:
            return False
        
        our_store_id = stores_data[0]['id']
        our_products = [p for p in products_data if p.get('store_id') == our_store_id]
        
        if not our_products:
            self.log_test("Update Product (PUT)", False, "No products from our store found")
            return False
        
        product_id = our_products[0]['id']
        
        # Update product data
        update_data = {
            "name": "Updated Product Name",
            "description": "Updated product description",
            "price": 75000,
            "stock": 15,
            "category_id": our_products[0]['category_id']
        }
        
        return self.run_test("Update Product (PUT)", "PUT", f"products/{product_id}", 200, update_data, headers)

    def test_payment_methods_support(self):
        """Test that the system supports multiple payment methods"""
        # Test creating orders with different payment methods
        if not self.customer_token:
            self.log_test("Payment Methods Support", False, "No customer token")
            return False
        
        headers = {'Authorization': f'Bearer {self.customer_token}'}
        
        # First add items to cart
        success, products = self.run_test("Get Products for Payment Test", "GET", "products", 200)
        if not success or not products:
            self.log_test("Payment Methods Support", False, "No products available")
            return False
        
        # Add a product to cart
        if products:
            product_id = products[0]['id']
            cart_item = {"product_id": product_id, "quantity": 1}
            success, _ = self.run_test("Add to Cart for Payment Test", "POST", "cart/add", 200, cart_item, headers)
            if not success:
                return False
        
        # Test different payment methods
        payment_methods = ["cash_on_delivery", "sham_cash", "bank_transfer", "visa"]
        
        for method in payment_methods:
            order_data = {
                "shipping_address": "دمشق، سوريا، شارع الاختبار 123",
                "phone": "0987654321",
                "payment_method": method
            }
            
            success, _ = self.run_test(f"Create Order with {method}", "POST", "orders", 200, order_data, headers)
            if not success:
                return False
            
            # Re-add item to cart for next test (since order creation clears cart)
            if products:
                cart_item = {"product_id": products[0]['id'], "quantity": 1}
                self.run_test(f"Re-add to Cart for {method}", "POST", "cart/add", 200, cart_item, headers)
        
        return True

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Syria Market API Tests...")
        print("=" * 50)
        
        # Basic tests
        self.test_health_check()
        self.test_get_categories()
        self.test_get_products()
        
        # Authentication tests - try existing admin first
        existing_admin_success = self.test_login_existing_admin()
        if not existing_admin_success:
            self.test_register_admin()
            self.test_login_admin()
        
        self.test_register_store_owner()
        self.test_register_customer()
        
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
        
        # NEW FEATURES TESTING - Shop Syria Updates
        print("\n🆕 Testing New Shop Syria Features...")
        print("-" * 30)
        
        # Test store orders API
        self.test_store_orders_api()
        
        # Test order status updates
        self.test_update_order_status_admin()
        self.test_update_order_status_store_owner()
        
        # Test product updates
        self.test_update_product_put()
        
        # Test payment methods support
        self.test_payment_methods_support()
        
        # Admin functionality tests
        self.test_admin_delete_store()
        
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
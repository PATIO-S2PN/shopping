const ShoppingService = require('../services/shopping-service'); // Update the path accordingly
const { RPCRequest } = require('../utils'); // Update the path accordingly
const { ShoppingRepository } = require('../database'); // Update the path accordingly

jest.mock('../utils', () => ({
  RPCRequest: jest.fn()
}));

jest.mock('../database', () => ({
  ShoppingRepository: jest.fn().mockImplementation(() => ({
    ManageCart: jest.fn(),
    Cart: jest.fn(),
    ManageWishlist: jest.fn(),
    GetWishlistByCustomerId: jest.fn(),
    CreateNewOrder: jest.fn(),
    Orders: jest.fn(),
    UpdateOrderStatus: jest.fn()
  }))
}));

describe('ShoppingService', () => {
  let service;
  const mockProduct = {
    _id: '1',
    name: 'Product Name',
    price: 100
  };

  const mockWishlist = {
    customerId: 'validCustomerId',
    products: [
      { _id: '1' },
      { _id: '2' }
    ]
  };

  beforeEach(() => {
    service = new ShoppingService();
    RPCRequest.mockClear();
    service.repository.ManageCart.mockClear();
    service.repository.Cart.mockClear();
    service.repository.ManageWishlist.mockClear();
    service.repository.GetWishlistByCustomerId.mockClear();
    service.repository.CreateNewOrder.mockClear();
    service.repository.Orders.mockClear();
    service.repository.UpdateOrderStatus.mockClear();
  });

  ////////////////////////// Add CART Item //////////////////////////////

  describe('AddCartItem', () => {
    it('should add item to cart successfully', async () => {
      RPCRequest.mockResolvedValue(mockProduct);
      service.repository.ManageCart.mockResolvedValue({
        success: true,
        cart: {
          items: [
            { product_id: '1', qty: 2 }
          ]
        }
      });

      const result = await service.AddCartItem('validCustomerId', '1', 2);

      expect(RPCRequest).toHaveBeenCalledWith("PRODUCT_RPC", {
        type: "VIEW_PRODUCT",
        data: '1'
      });

      expect(service.repository.ManageCart).toHaveBeenCalledWith(
        'validCustomerId',
        mockProduct,
        2
      );

      expect(result).toEqual({
        success: true,
        cart: {
          items: [
            { product_id: '1', qty: 2 }
          ]
        }
      });
    });

    it('should throw an error if product data is not found', async () => {
      RPCRequest.mockResolvedValue(null);

      await expect(service.AddCartItem('validCustomerId', 'invalidProductId', 2))
        .rejects.toThrow('Product data not found!');
    });

    it('should handle invalid customerId or product_id', async () => {
      RPCRequest.mockResolvedValue(null);

      await expect(service.AddCartItem('invalidCustomerId', 'invalidProductId', 2))
        .rejects.toThrow('Product data not found!');
    });

    it('should handle qty as zero or negative', async () => {
      RPCRequest.mockResolvedValue(mockProduct);
      service.repository.ManageCart.mockResolvedValue({
        success: true,
        cart: {
          items: [
            { product_id: '1', qty: 0 }
          ]
        }
      });

      const result = await service.AddCartItem('validCustomerId', '1', 0);

      expect(RPCRequest).toHaveBeenCalledWith("PRODUCT_RPC", {
        type: "VIEW_PRODUCT",
        data: '1'
      });

      expect(service.repository.ManageCart).toHaveBeenCalledWith(
        'validCustomerId',
        mockProduct,
        0
      );

      expect(result).toEqual({
        success: true,
        cart: {
          items: [
            { product_id: '1', qty: 0 }
          ]
        }
      });
    });
  });

  ////////////////////////// RemoveCART Item //////////////////////////////

  describe('RemoveCartItem', () => {
    it('should remove item from cart successfully', async () => {
      service.repository.ManageCart.mockResolvedValue({
        success: true,
        cart: {
          items: []
        }
      });

      const result = await service.RemoveCartItem('validCustomerId', 'validProductId');

      expect(service.repository.ManageCart).toHaveBeenCalledWith(
        'validCustomerId',
        { _id: 'validProductId' },
        0,
        true
      );

      expect(result).toEqual({
        success: true,
        cart: {
          items: []
        }
      });
    });

    it('should throw an error if ManageCart fails', async () => {
      service.repository.ManageCart.mockRejectedValue(new Error('Failed to remove item from cart'));

      await expect(service.RemoveCartItem('validCustomerId', 'validProductId'))
        .rejects.toThrow('Failed to remove item from cart');
    });

    it('should handle non-existent product_id gracefully', async () => {
      service.repository.ManageCart.mockResolvedValue({
        success: true,
        cart: {
          items: [
            { product_id: '2', qty: 1 }
          ]
        }
      });

      const result = await service.RemoveCartItem('validCustomerId', 'nonExistentProductId');

      expect(service.repository.ManageCart).toHaveBeenCalledWith(
        'validCustomerId',
        { _id: 'nonExistentProductId' },
        0,
        true
      );

      expect(result).toEqual({
        success: true,
        cart: {
          items: [
            { product_id: '2', qty: 1 }
          ]
        }
      });
    });
  });

  ////////////////////////// Get CART //////////////////////////////

  describe('GetCart', () => {
    it('should get the cart successfully', async () => {
      const mockCart = {
        success: true,
        cart: {
          items: [
            { product_id: '1', qty: 2 }
          ]
        }
      };

      service.repository.Cart.mockResolvedValue(mockCart);

      const result = await service.GetCart('validCartId');

      expect(service.repository.Cart).toHaveBeenCalledWith('validCartId');

      expect(result).toEqual(mockCart);
    });

    it('should throw an error if Cart fails', async () => {
      service.repository.Cart.mockRejectedValue(new Error('Failed to get cart'));

      await expect(service.GetCart('validCartId'))
        .rejects.toThrow('Failed to get cart');
    });

    it('should return an empty cart if no items exist', async () => {
      const emptyCart = {
        success: true,
        cart: {
          items: []
        }
      };

      service.repository.Cart.mockResolvedValue(emptyCart);

      const result = await service.GetCart('validCartId');

      expect(service.repository.Cart).toHaveBeenCalledWith('validCartId');

      expect(result).toEqual(emptyCart);
    });
  });

  ////////////////////////// Add Item to Wishlist //////////////////////////////

  describe('AddToWishlist', () => {
    it('should add item to wishlist successfully', async () => {
      service.repository.ManageWishlist.mockResolvedValue({
        success: true,
        wishlist: {
          items: [
            { product_id: '1' }
          ]
        }
      });

      const result = await service.AddToWishlist('validCustomerId', 'validProductId');

      expect(service.repository.ManageWishlist).toHaveBeenCalledWith(
        'validCustomerId',
        'validProductId'
      );

      expect(result).toEqual({
        success: true,
        wishlist: {
          items: [
            { product_id: '1' }
          ]
        }
      });
    });
  });

  ////////////////////////// Remove Item from Wishlist //////////////////////////////

  describe('RemoveFromWishlist', () => {
    it('should remove item from wishlist successfully', async () => {
      service.repository.ManageWishlist.mockResolvedValue({
        success: true,
        wishlist: {
          items: []
        }
      });

      const result = await service.RemoveFromWishlist('validCustomerId', 'validProductId');

      expect(service.repository.ManageWishlist).toHaveBeenCalledWith(
        'validCustomerId',
        'validProductId',
        true
      );

      expect(result).toEqual({
        success: true,
        wishlist: {
          items: []
        }
      });
    });

    it('should throw an error if ManageWishlist fails', async () => {
      service.repository.ManageWishlist.mockRejectedValue(new Error('Failed to remove item from wishlist'));

      await expect(service.RemoveFromWishlist('validCustomerId', 'validProductId'))
        .rejects.toThrow('Failed to remove item from wishlist');
    });
  });

  ////////////////////////// Get Wishlist //////////////////////////////

  describe('GetWishlist', () => {
    it('should get the wishlist successfully', async () => {
      service.repository.GetWishlistByCustomerId.mockResolvedValue(mockWishlist);
      RPCRequest.mockResolvedValue([
        { _id: '1', name: 'Product 1', price: 100 },
        { _id: '2', name: 'Product 2', price: 200 }
      ]);

      const result = await service.GetWishlist('validCustomerId');

      expect(service.repository.GetWishlistByCustomerId).toHaveBeenCalledWith('validCustomerId');

      expect(RPCRequest).toHaveBeenCalledWith('PRODUCT_RPC', {
        type: 'VIEW_PRODUCTS',
        data: ['1', '2']
      });

      expect(result).toEqual([
        { _id: '1', name: 'Product 1', price: 100 },
        { _id: '2', name: 'Product 2', price: 200 }
      ]);
    });

    it('should return an empty object if wishlist is not found', async () => {
      service.repository.GetWishlistByCustomerId.mockResolvedValue(null);

      const result = await service.GetWishlist('validCustomerId');

      expect(service.repository.GetWishlistByCustomerId).toHaveBeenCalledWith('validCustomerId');

      expect(result).toEqual({});
    });
  });

  ////////////////////////// Create Order //////////////////////////////

  describe('CreateOrder', () => {
    it('should create order successfully', async () => {
      service.repository.CreateNewOrder.mockResolvedValue({
        success: true,
        order: {
          id: 'orderId123',
          customerId: 'validCustomerId',
          txnNumber: 'txn123'
        }
      });

      const result = await service.CreateOrder('validCustomerId', 'txn123');

      expect(service.repository.CreateNewOrder).toHaveBeenCalledWith('validCustomerId', 'txn123');

      expect(result).toEqual({
        success: true,
        order: {
          id: 'orderId123',
          customerId: 'validCustomerId',
          txnNumber: 'txn123'
        }
      });
    });

    it('should throw an error if CreateNewOrder fails', async () => {
      service.repository.CreateNewOrder.mockRejectedValue(new Error('Failed to create order'));

      await expect(service.CreateOrder('validCustomerId', 'txn123'))
        .rejects.toThrow('Failed to create order');
    });
  });

  ////////////////////////// Get Order //////////////////////////////

  describe('GetOrder', () => {
    it('should get the order successfully', async () => {
      const mockOrder = {
        id: 'orderId123',
        customerId: 'validCustomerId',
        txnNumber: 'txn123',
        items: [
          { productId: '1', qty: 2, price: 100 },
          { productId: '2', qty: 1, price: 200 }
        ]
      };

      service.repository.Orders.mockResolvedValue(mockOrder);

      const result = await service.GetOrder('validCustomerId', 'orderId123');

      expect(service.repository.Orders).toHaveBeenCalledWith('validCustomerId', 'orderId123');

      expect(result).toEqual(mockOrder);
    });

    it('should throw an error if Orders fails', async () => {
      service.repository.Orders.mockRejectedValue(new Error('Failed to get order'));

      await expect(service.GetOrder('validCustomerId', 'orderId123'))
        .rejects.toThrow('Failed to get order');
    });
  });

  ////////////////////////// Update Order Status //////////////////////////////

  describe('UpdateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const mockUpdateResponse = {
        success: true,
        status: 'shipped'
      };

      service.repository.UpdateOrderStatus.mockResolvedValue(mockUpdateResponse);

      const result = await service.UpdateOrderStatus('validCustomerId', 'orderId123', 'shipped');

      expect(service.repository.UpdateOrderStatus).toHaveBeenCalledWith('orderId123', 'validCustomerId', 'shipped');

      expect(result).toEqual(mockUpdateResponse);
    });

    it('should throw an error if UpdateOrderStatus fails', async () => {
      service.repository.UpdateOrderStatus.mockRejectedValue(new Error('Failed to update order status'));

      await expect(service.UpdateOrderStatus('validCustomerId', 'orderId123', 'shipped'))
        .rejects.toThrow('Failed to update order status');
    });
  });

  ////////////////////////// Get Orders //////////////////////////////

  describe('GetOrders', () => {
    it('should get orders successfully', async () => {
      const mockOrders = [
        {
          id: 'orderId123',
          customerId: 'validCustomerId',
          txnNumber: 'txn123',
          items: [
            { productId: '1', qty: 2, price: 100 },
            { productId: '2', qty: 1, price: 200 }
          ]
        },
        {
          id: 'orderId124',
          customerId: 'validCustomerId',
          txnNumber: 'txn124',
          items: [
            { productId: '3', qty: 1, price: 300 },
            { productId: '4', qty: 4, price: 400 }
          ]
        }
      ];

      service.repository.Orders.mockResolvedValue(mockOrders);

      const result = await service.GetOrders('validCustomerId');

      expect(service.repository.Orders).toHaveBeenCalledWith('validCustomerId');

      expect(result).toEqual(mockOrders);
    });

    it('should throw an error if Orders fails', async () => {
      service.repository.Orders.mockRejectedValue(new Error('Failed to get orders'));

      await expect(service.GetOrders('validCustomerId'))
        .rejects.toThrow('Failed to get orders');
    });
  });
});

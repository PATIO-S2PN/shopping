const sinon = require('sinon');
const ShoppingService = require('./ShoppingService'); // assuming ShoppingService is exported from ShoppingService.js

describe('ShoppingService', () => {
  describe('AddCartItem', () => {
    it('should add an item to the cart', async () => {
      // Create a stub for the repository.ManageCart method
      const manageCartStub = sinon.stub(ShoppingService.prototype.repository, 'ManageCart');

      // Make the stub resolve with a fake cart
      manageCartStub.resolves({ customerId: '123', products: [{ _id: '456', qty: 1 }] });

      // Create an instance of ShoppingService
      const service = new ShoppingService();

      // Call the AddCartItem method
      const result = await service.AddCartItem('123', '456', 1);

      // Assert that the stub was called with the correct arguments
      sinon.assert.calledWith(manageCartStub, '123', sinon.match.any, 1);

      // Assert that the result is as expected
      expect(result).toEqual({ customerId: '123', products: [{ _id: '456', qty: 1 }] });

      // Restore the stub
      manageCartStub.restore();
    });
  });
});

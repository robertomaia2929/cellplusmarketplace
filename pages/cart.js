import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useContext(CartContext);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Carrito de Compras</h1>
        <p>Tu carrito está vacío.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Carrito de Compras</h1>
      <ul>
        {cartItems.map(item => (
          <li
            key={item.id}
            className="border p-4 mb-4 rounded shadow flex justify-between items-center"
          >
            <div>
              <h2 className="text-lg font-semibold">{item.nombre}</h2>
              <p>Cantidad: {item.quantity}</p>
              <p>Precio unitario: ${item.precio}</p>
              <p>Subtotal: ${item.precio * item.quantity}</p>
            </div>
            <button
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              onClick={() => removeFromCart(item.id)}
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
      <button
        className="mt-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
        onClick={clearCart}
      >
        Vaciar Carrito
      </button>
    </div>
  );
}

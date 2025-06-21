import { useContext } from 'react';
import Link from 'next/link';
import { CartContext } from '../context/CartContext';

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useContext(CartContext);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Carrito de Compras</h1>
        <p>Tu carrito está vacío.</p>
        <link href='/products'>
        <button className='mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'>
          volver al catalogo
        </button>
        
        </link>
      </div>
    );
  }
  const total = cartItems.reduce(
    (acc, item) => acc + item.precio * item.quantity, 0
  );

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
            <p className="font-bold text-lg mt-4 mb-2">Total: ${total.toFixed(2)}</p>

       <div className="flex gap-4 mt-4">
        <button
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
          onClick={clearCart}
        >
          Vaciar Carrito
        </button>

        <Link href="/checkout">
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Proceder al pago
          </button>
        </Link>

        <Link href="/products">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Seguir comprando
          </button>
        </Link>
      </div>



    </div>
  );
}

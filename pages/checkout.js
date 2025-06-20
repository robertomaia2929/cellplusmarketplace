import { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import QRCode from 'qrcode.react';  // Importa el componente QR

export default function CheckoutPage() {
  const { cartItems, clearCart } = useContext(CartContext);
  const [form, setForm] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
  });
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const totalAmount = cartItems.reduce(
    (total, item) => total + item.precio * item.quantity,
    0
  );

  const yappyData = `yappy://pay?recipient=TU_NUMERO_O_CODIGO&amount=${totalAmount.toFixed(2)}`;

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.nombre || !form.direccion || !form.telefono || !form.email) {
      alert('Por favor llena todos los campos');
      return;
    }
    // Aquí podrías validar que el pago ya se haya realizado (opcional)
    setOrderConfirmed(true);
    clearCart();
  };

  if (orderConfirmed) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">¡Compra realizada con éxito!</h1>
        <p>Gracias por tu compra, {form.nombre}.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {/* Mostrar QR solo si hay productos */}
      {cartItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Paga con Yappy</h2>
          <p>Total a pagar: <strong>${totalAmount.toFixed(2)}</strong></p>
          <QRCode value={yappyData} size={200} />
          <p className="mt-2 text-sm text-gray-700">
            Escanea este código con Yappy para hacer el pago.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <input
          type="text"
          name="nombre"
          placeholder="Nombre completo"
          value={form.nombre}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="direccion"
          placeholder="Dirección"
          value={form.direccion}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="tel"
          name="telefono"
          placeholder="Teléfono"
          value={form.telefono}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Confirmar compra
        </button>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Resumen de pedido</h2>
        <ul>
          {cartItems.map(item => (
            <li key={item.id} className="mb-2">
              {item.nombre} x {item.quantity} - ${item.precio * item.quantity}
            </li>
          ))}
        </ul>
        <p className="font-bold mt-2">
          Total: ${totalAmount.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

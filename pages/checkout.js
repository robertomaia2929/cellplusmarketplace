import { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { QRCodeSVG } from 'qrcode.react'; // Cambiado a named import QRCodeSVG
import { auth, db } from '../lib/firebase'; 
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function CheckoutPage() {
  const { cartItems, clearCart } = useContext(CartContext);

  // Para verificar que QRCodeSVG se importa bien
  console.log('QRCodeSVG:', QRCodeSVG);

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

  const yappyData = `yappy://pay?recipient=67890123&amount=${totalAmount.toFixed(2)}`;

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!form.nombre || !form.direccion || !form.telefono || !form.email) {
      alert('Por favor llena todos los campos');
      return;
    }

    try {
      await addDoc(collection(db, 'orders'), {
        uid: auth.currentUser ? auth.currentUser.uid : null,
        nombre: form.nombre,
        direccion: form.direccion,
        telefono: form.telefono,
        email: form.email,
        items: cartItems,
        total: totalAmount,
        estado: 'pendiente',
        creadoEn: Timestamp.now()
      });

      setOrderConfirmed(true);
      clearCart();
    } catch (error) {
      console.error('Error al guardar el pedido:', error);
      alert('Ocurrió un error al guardar el pedido.');
    }
  };

  if (orderConfirmed) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">¡Compra realizada con éxito!</h1>
        <p>Gracias por tu compra, {form.nombre}.</p>
        <p className="mt-4 text-gray-600">Nos pondremos en contacto contigo para coordinar el envío.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {cartItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Paga con Yappy</h2>
          <p>Total a pagar: <strong>${totalAmount.toFixed(2)}</strong></p>
          {/* Usamos QRCodeSVG aquí */}
          <QRCodeSVG value={yappyData} size={200} />
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

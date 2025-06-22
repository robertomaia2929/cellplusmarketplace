import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        if (!userData || userData.rol !== 'admin') {
          alert('Acceso denegado: no eres administrador');
          router.push('/');
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const ordersList = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersList);
        setLoading(false);
      } catch (error) {
        console.error('Error al obtener pedidos:', error);
      }
    };

    fetchOrders();
  }, []);

  const handleEstadoChange = async (orderId, newEstado) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { estado: newEstado });
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, estado: newEstado } : order
        )
      );
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('No se pudo actualizar el estado.');
    }
  };

  const handleEliminar = async (orderId) => {
    const confirm = window.confirm("¿Estás seguro de que deseas eliminar esta factura?");
    if (!confirm) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setOrders(prev => prev.filter(order => order.id !== orderId));
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      alert("No se pudo eliminar el pedido");
    }
  };

  const openModal = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setModalOpen(false);
  };

  const pedidosFiltrados = orders.filter(order => {
    const texto = busqueda.toLowerCase();
    const coincideBusqueda =
      (order.nombre?.toLowerCase() || '').includes(texto) ||
      (order.email?.toLowerCase() || '').includes(texto) ||
      (order.telefono?.toLowerCase() || '').includes(texto) ||
      (order.direccion?.toLowerCase() || '').includes(texto) ||
      (order.total?.toString() || '').includes(texto) ||
      (order.estado?.toLowerCase() || '').includes(texto);

    const coincideEstado = estadoFiltro === 'todos' || order.estado === estadoFiltro;

    return coincideBusqueda && coincideEstado;
  });

  const downloadPDF = () => {
    if (!pedidosFiltrados.length) return alert('No hay pedidos para descargar');

    const doc = new jsPDF();
    doc.text('Listado de Pedidos', 14, 15);

    const tableColumn = ['Cliente', 'Correo', 'Teléfono', 'Dirección', 'Total', 'Estado'];
    const tableRows = pedidosFiltrados.map(order => [
      order.nombre || '',
      order.email || '',
      order.telefono || '',
      order.direccion || '',
      order.total ? `$${Number(order.total).toFixed(2)}` : '',
      order.estado || ''
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save('pedidos.pdf');
  };

  const imprimirDetalles = () => {
    const doc = new jsPDF();
    doc.text('Detalles del Pedido', 14, 20);
    if (!selectedOrder) return;

    const data = [
      ['Nombre', selectedOrder.nombre],
      ['Correo', selectedOrder.email],
      ['Teléfono', selectedOrder.telefono],
      ['Dirección', selectedOrder.direccion],
      ['Estado', selectedOrder.estado],
      ['Total', `$${Number(selectedOrder.total).toFixed(2)}`]
    ];

    autoTable(doc, {
      startY: 30,
      body: data
    });

    if (selectedOrder.items?.length) {
      doc.text('Productos:', 14, doc.lastAutoTable.finalY + 10);
      const productos = selectedOrder.items.map(item => [
        item.nombre,
        item.quantity,
        `$${item.precio * item.quantity}`
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        head: [['Producto', 'Cantidad', 'Subtotal']],
        body: productos
      });
    }

    doc.save('detalle_pedido.pdf');
  };

  if (loading) return <p className="p-4 text-white">Cargando pedidos...</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 text-white">
      <h1 className="text-3xl font-bold mb-6 text-white">Panel de Administración</h1>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <button onClick={downloadPDF} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Descargar PDF</button>

        <input
          type="text"
          placeholder="Buscar por nombre, correo, estado, etc..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value.toLowerCase())}
          className="border p-2 w-full md:w-1/2 rounded text-black bg-white"
        />

        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="border px-4 py-2 rounded text-black bg-white"
        >
          <option value="todos">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
          <option value="entregado">Entregado</option>
        </select>
      </div>

      {pedidosFiltrados.length === 0 ? (
        <p>No hay pedidos registrados.</p>
      ) : (
        <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-3">Cliente</th>
              <th className="p-3">Correo</th>
              <th className="p-3">Teléfono</th>
              <th className="p-3">Dirección</th>
              <th className="p-3">Total</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Cambiar Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidosFiltrados.map(order => (
              <tr key={order.id} className="border-t hover:bg-gray-100 text-black">
                <td className="p-3">{order.nombre}</td>
                <td className="p-3">{order.email}</td>
                <td className="p-3">{order.telefono}</td>
                <td className="p-3">{order.direccion}</td>
                <td className="p-3">${Number(order.total).toFixed(2)}</td>
                <td className="p-3 capitalize">{order.estado}</td>
                <td className="p-3">
                  <select
                    value={order.estado}
                    onChange={(e) => handleEstadoChange(order.id, e.target.value)}
                    className="border rounded px-2 py-1 text-black bg-white"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                    <option value="entregado">Entregado</option>
                  </select>
                </td>
                <td className="p-3 space-x-2">
                  <button onClick={() => openModal(order)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition">Ver detalles</button>
                  <button onClick={() => handleEliminar(order.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto text-black">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-gray-800">Detalles del Pedido</h2>

            <div className="space-y-2 text-gray-800">
              <p><span className="font-semibold">Nombre:</span> {selectedOrder.nombre}</p>
              <p><span className="font-semibold">Correo:</span> {selectedOrder.email}</p>
              <p><span className="font-semibold">Teléfono:</span> {selectedOrder.telefono}</p>
              <p><span className="font-semibold">Dirección:</span> {selectedOrder.direccion}</p>
              <p><span className="font-semibold">Estado:</span> <span className="capitalize">{selectedOrder.estado}</span></p>
              <p><span className="font-semibold">Total:</span> ${Number(selectedOrder.total).toFixed(2)}</p>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Productos:</h3>
              <ul className="list-disc list-inside max-h-40 overflow-auto">
                {selectedOrder.items && selectedOrder.items.map((item, i) => (
                  <li key={i}>{item.nombre} x {item.quantity} - ${item.precio * item.quantity}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex justify-between">
              <button onClick={closeModal} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">Cerrar</button>
              <button onClick={imprimirDetalles} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">Imprimir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, limit, startAfter } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [stats, setStats] = useState({ total: 0, pagado: 0, pendiente: 0, entregado: 0 });
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

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), orderBy('nombre'), limit(10));
      const snapshot = await getDocs(q);
      const last = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(last);
      const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersList);
      setLoading(false);
      calcularEstadisticas(ordersList);
    } catch (error) {
      console.error('Error al obtener pedidos:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const calcularEstadisticas = (lista) => {
    let total = lista.length;
    let pagado = lista.filter(o => o.estado === 'pagado').length;
    let pendiente = lista.filter(o => o.estado === 'pendiente').length;
    let entregado = lista.filter(o => o.estado === 'entregado').length;
    setStats({ total, pagado, pendiente, entregado });
  };

  const handleEstadoChange = async (orderId, newEstado) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { estado: newEstado });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, estado: newEstado } : o));
      toast.success('Estado actualizado');
    } catch (error) {
      toast.error('No se pudo actualizar el estado.');
    }
  };

  const handleDelete = async (orderId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este pedido?')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setOrders(prev => prev.filter(order => order.id !== orderId));
      toast.success('Pedido eliminado');
    } catch (error) {
      toast.error('Error al eliminar el pedido');
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
    const matchBusqueda =
      (order.nombre?.toLowerCase() || '').includes(busqueda) ||
      (order.email?.toLowerCase() || '').includes(busqueda) ||
      (order.telefono?.toLowerCase() || '').includes(busqueda) ||
      (order.direccion?.toLowerCase() || '').includes(busqueda) ||
      (order.estado?.toLowerCase() || '').includes(busqueda) ||
      (order.total?.toString().includes(busqueda));
    const matchEstado = estadoFiltro ? order.estado === estadoFiltro : true;
    return matchBusqueda && matchEstado;
  });

  const downloadCSV = () => {
    if (!pedidosFiltrados.length) return alert('No hay pedidos para descargar');
    const headers = ['Cliente', 'Correo', 'Teléfono', 'Dirección', 'Total', 'Estado'];
    const rows = pedidosFiltrados.map(order => [order.nombre, order.email, order.telefono, order.direccion, Number(order.total).toFixed(2), order.estado]);
    let csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n';
    rows.forEach(row => csvContent += row.join(',') + '\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = 'pedidos.csv';
    link.click();
  };

  const downloadPDF = () => {
    if (!pedidosFiltrados.length) return alert('No hay pedidos para descargar');
    const docu = new jsPDF();
    docu.text('Listado de Pedidos', 14, 15);
    const tableColumn = ['Cliente', 'Correo', 'Teléfono', 'Dirección', 'Total', 'Estado'];
    const tableRows = pedidosFiltrados.map(order => [order.nombre, order.email, order.telefono, order.direccion, `$${Number(order.total).toFixed(2)}`, order.estado]);
    autoTable(docu, { head: [tableColumn], body: tableRows, startY: 20 });
    docu.save('pedidos.pdf');
  };

  const imprimirDetalles = () => {
    if (!selectedOrder) return;
    const docu = new jsPDF();
    docu.text(`Pedido de ${selectedOrder.nombre}`, 14, 15);
    autoTable(docu, {
      body: [
        ['Correo', selectedOrder.email],
        ['Teléfono', selectedOrder.telefono],
        ['Dirección', selectedOrder.direccion],
        ['Estado', selectedOrder.estado],
        ['Total', `$${Number(selectedOrder.total).toFixed(2)}`]
      ]
    });
    if (selectedOrder.items && selectedOrder.items.length) {
      docu.text('Productos:', 14, 80);
      autoTable(docu, {
        startY: 85,
        head: [['Producto', 'Cantidad', 'Precio Total']],
        body: selectedOrder.items.map(i => [i.nombre, i.quantity, `$${i.precio * i.quantity}`])
      });
    }
    docu.save('detalle_pedido.pdf');
  };

  if (loading) return <p className="p-4 text-white">Cargando pedidos...</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 text-white">
      <Toaster />
      <h1 className="text-3xl font-bold mb-6 text-white">Panel de Administración</h1>

      <div className="grid md:grid-cols-4 gap-4 text-sm mb-6">
        <div className="bg-gray-800 p-4 rounded">Total: {stats.total}</div>
        <div className="bg-green-800 p-4 rounded">Pagados: {stats.pagado}</div>
        <div className="bg-yellow-700 p-4 rounded">Pendientes: {stats.pendiente}</div>
        <div className="bg-blue-800 p-4 rounded">Entregados: {stats.entregado}</div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <button onClick={downloadPDF} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">PDF</button>
        <input
          type="text"
          placeholder="Buscar por nombre, correo, estado..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value.toLowerCase())}
          className="border p-2 w-full md:w-1/2 rounded text-white"
        />
        <button onClick={downloadCSV} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">CSV</button>
      </div>

      <div className="mb-4">
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="p-2 border rounded text-black bg-white"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
          <option value="entregado">Entregado</option>
        </select>
      </div>

      <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="p-3">Cliente</th>
            <th className="p-3">Correo</th>
            <th className="p-3">Teléfono</th>
            <th className="p-3">Dirección</th>
            <th className="p-3">Total</th>
            <th className="p-3">Estado</th>
            <th className="p-3">Cambiar</th>
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
                <button onClick={() => openModal(order)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Ver</button>
                <button onClick={() => handleDelete(order.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto text-black">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-gray-800">Detalles del Pedido</h2>
            <div className="space-y-2 text-gray-800">
              <p><strong>Nombre:</strong> {selectedOrder.nombre}</p>
              <p><strong>Correo:</strong> {selectedOrder.email}</p>
              <p><strong>Teléfono:</strong> {selectedOrder.telefono}</p>
              <p><strong>Dirección:</strong> {selectedOrder.direccion}</p>
              <p><strong>Estado:</strong> {selectedOrder.estado}</p>
              <p><strong>Total:</strong> ${Number(selectedOrder.total).toFixed(2)}</p>
            </div>
            <h3 className="text-lg font-semibold mt-4">Productos</h3>
            <ul className="list-disc list-inside">
              {selectedOrder.items && selectedOrder.items.map((item, i) => (
                <li key={i}>{item.nombre} x {item.quantity} - ${item.precio * item.quantity}</li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between">
              <button onClick={closeModal} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Cerrar</button>
              <button onClick={imprimirDetalles} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Imprimir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

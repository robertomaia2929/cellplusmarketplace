import { useEffect, useState, useContext } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CartContext } from '../context/CartContext';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    async function fetchProducts() {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.Nombre || '',       // Convertimos Nombre a nombre
          precio: data.precio || 0,
          descripcion: data.descripcion || '',
          imagenUrl: data.imagenUrl || '',
          stock: data.strock || 0,         // Recuerda corregir "strock" en Firestore si puedes
          categoria: data.categoria || '',
        };
      });
      setProducts(productList);
    }
    fetchProducts();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Catálogo de Productos</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="border p-4 rounded shadow">
            <img
              src={product.imagenUrl}
              alt={product.nombre}
              className="w-full h-48 object-cover mb-2"
            />
            <h2 className="text-lg font-semibold">{product.nombre}</h2>
            <p className="text-sm text-gray-600">{product.descripcion}</p>
            <p className="mt-2 font-bold text-blue-600">${product.precio}</p>
            <button
              className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              onClick={() => addToCart(product)}
            >
              Agregar al carrito
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


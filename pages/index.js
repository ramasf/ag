import { useEffect, useState } from 'react';

export default function Home() {
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.productos)) {
          setProductos(data.productos);
        } else {
          setProductos([]);
          setError(true);
        }
      })
      .catch(err => {
        console.error(err);
        setProductos([]);
        setError(true);
      });
  }, []);

  if (error) {
    return <p style={{ padding: 30, color: "red" }}>Hubo un error al cargar los productos.</p>;
  }

  if (!productos.length) {
    return <p style={{ padding: 30 }}>Cargando productos...</p>;
  }

  return (
    <div style={{
      padding: 30,
      background: "#f1f2f4",
      display: "flex",
      flexWrap: "wrap",
      gap: 20,
      justifyContent: "center"
    }}>
      {productos.map((p, i) => (
        <div key={i} style={{
          background: "#fff",
          padding: 20,
          width: 250,
          borderRadius: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
        }}>
          <div style={{ fontSize: 12, color: "#777" }}>CODIGO:</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{p.nombre}</div>
          <div style={{ fontSize: 14, marginBottom: 20 }}>{p.descripcion}</div>
          <div style={{
            borderTop: "1px solid #eee",
            paddingTop: 12,
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 600
          }}>
            <div>USD {p.precio_usd}</div>
            <div>{p.moneda} {p.precio_local}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";

// Configuración de Firebase (Reemplaza con tus credenciales)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_DOMINIO.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  const [expedientes, setExpedientes] = useState([]);
  const [filtroEstatus, setFiltroEstatus] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState({
    numeroExpediente: "",
    cliente: "",
    fechaEntrada: "",
    puertoOrigen: "",
    destinoFinal: "",
    estatus: "pendiente",
    observaciones: "",
  });
  const [editandoId, setEditandoId] = useState(null);

  // Escuchar cambios en autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchExpedientes();
      } else {
        setUser(null);
        setExpedientes([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Obtener expedientes desde Firestore
  const fetchExpedientes = () => {
    const expedientesRef = collection(db, "expedientes");
    onSnapshot(expedientesRef, (snapshot) => {
      let lista = [];
      snapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      setExpedientes(lista);
    });
  };

  // Manejar login/registro
  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    signOut(auth);
  };

  // Guardar o actualizar expediente
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.numeroExpediente || !form.cliente || !form.fechaEntrada) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    try {
      if (editandoId) {
        const docRef = doc(db, "expedientes", editandoId);
        await updateDoc(docRef, form);
        setEditandoId(null);
      } else {
        await addDoc(collection(db, "expedientes"), form);
      }

      setForm({
        numeroExpediente: "",
        cliente: "",
        fechaEntrada: "",
        puertoOrigen: "",
        destinoFinal: "",
        estatus: "pendiente",
        observaciones: "",
      });
    } catch (err) {
      console.error("Error guardando expediente:", err);
    }
  };

  // Eliminar expediente
  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este expediente?")) {
      const docRef = doc(db, "expedientes", id);
      await deleteDoc(docRef);
    }
  };

  // Editar expediente
  const handleEdit = (item) => {
    setForm(item);
    setEditandoId(item.id);
  };

  // Filtrar expedientes
  const expedientesFiltrados = expedientes.filter((exp) => {
    const coincideBusqueda =
      exp.numeroExpediente.toLowerCase().includes(busqueda.toLowerCase()) ||
      exp.cliente.toLowerCase().includes(busqueda.toLowerCase());

    if (filtroEstatus === "todos") return coincideBusqueda;
    return exp.estatus === filtroEstatus && coincideBusqueda;
  });

  // Estadísticas
  const total = expedientes.length;
  const pendientes = expedientes.filter((e) => e.estatus === "pendiente").length;
  const enProceso = expedientes.filter((e) => e.estatus === "en proceso").length;
  const completados = expedientes.filter((e) => e.estatus === "completado").length;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-center mb-6">
            {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </h2>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <form onSubmit={handleAuth}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded mb-4"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded mb-4"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              {isLogin ? "Iniciar Sesión" : "Registrar"}
            </button>
          </form>
          <p className="mt-4 text-center">
            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-blue-600 underline"
            >
              {isLogin ? "Regístrate aquí" : "Inicia sesión"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gestión de Expedientes</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Cerrar Sesión
          </button>
        </header>

        {/* Panel de Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded shadow text-center">
            <h3 className="text-xl font-semibold">Total</h3>
            <p className="text-2xl">{total}</p>
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
            <h3 className="text-xl font-semibold">Pendientes</h3>
            <p className="text-2xl">{pendientes}</p>
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
            <h3 className="text-xl font-semibold">En Proceso</h3>
            <p className="text-2xl">{enProceso}</p>
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
            <h3 className="text-xl font-semibold">Completados</h3>
            <p className="text-2xl">{completados}</p>
          </div>
        </div>

        {/* Formulario */}
        <section className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-xl font-bold mb-4">
            {editandoId ? "Editar Expediente" : "Nuevo Expediente"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Número de Expediente"
                value={form.numeroExpediente}
                onChange={(e) =>
                  setForm({ ...form, numeroExpediente: e.target.value })
                }
                required
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Cliente"
                value={form.cliente}
                onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                required
                className="border p-2 rounded"
              />
              <input
                type="date"
                value={form.fechaEntrada}
                onChange={(e) =>
                  setForm({ ...form, fechaEntrada: e.target.value })
                }
                required
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Puerto de Origen"
                value={form.puertoOrigen}
                onChange={(e) =>
                  setForm({ ...form, puertoOrigen: e.target.value })
                }
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Destino Final"
                value={form.destinoFinal}
                onChange={(e) =>
                  setForm({ ...form, destinoFinal: e.target.value })
                }
                className="border p-2 rounded"
              />
              <select
                value={form.estatus}
                onChange={(e) =>
                  setForm({ ...form, estatus: e.target.value })
                }
                className="border p-2 rounded"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en proceso">En Proceso</option>
                <option value="completado">Completado</option>
              </select>
            </div>
            <textarea
              placeholder="Observaciones"
              value={form.observaciones}
              onChange={(e) =>
                setForm({ ...form, observaciones: e.target.value })
              }
              className="w-full border p-2 rounded"
            ></textarea>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              {editandoId ? "Actualizar Expediente" : "Agregar Expediente"}
            </button>
          </form>
        </section>

        {/* Búsqueda y Filtros */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Buscar por número o cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="border p-2 rounded flex-grow"
            />
            <select
              value={filtroEstatus}
              onChange={(e) => setFiltroEstatus(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="todos">Todos los Estatus</option>
              <option value="pendiente">Pendientes</option>
              <option value="en proceso">En Proceso</option>
              <option value="completado">Completados</option>
            </select>
          </div>
        </section>

        {/* Tabla de Expedientes */}
        <section className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2">N° Expediente</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Fecha Entrada</th>
                <th className="px-4 py-2">Puerto Origen</th>
                <th className="px-4 py-2">Destino</th>
                <th className="px-4 py-2">Estatus</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expedientesFiltrados.map((exp) => (
                <tr key={exp.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{exp.numeroExpediente}</td>
                  <td className="px-4 py-2">{exp.cliente}</td>
                  <td className="px-4 py-2">{exp.fechaEntrada}</td>
                  <td className="px-4 py-2">{exp.puertoOrigen}</td>
                  <td className="px-4 py-2">{exp.destinoFinal}</td>
                  <td className="px-4 py-2 capitalize">{exp.estatus}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(exp)}
                      className="text-blue-500 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

export default App;

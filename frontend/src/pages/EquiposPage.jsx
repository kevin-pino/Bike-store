import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductForm from '../components/TeamForm';
import ProductGrid from '../components/TeamTable';
import { useAuth } from '../hooks/useAuth';
import { agregarAlCarrito } from '../services/carrito.service';
import {
    createProducto,
    getProductos,
    getProductosAdmin,
    setProductoActivo,
    updateProducto
} from '../services/equipos.service';

export default function ProductCatalogPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const role = String(user?.rol || '').trim().toLowerCase();
    const isAdmin = role === 'admin';
    const isCustomer = role === 'cliente';
    const [productos, setProductos] = useState([]);
    const [editing, setEditing] = useState(null);
    const [categoria, setCategoria] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [ordenPrecio, setOrdenPrecio] = useState('');
    const [error, setError] = useState('');
    const [aviso, setAviso] = useState('');

    const load = useCallback(async function load() {
        try {
            setError('');
            const result = isAdmin ? await getProductosAdmin() : await getProductos();
            setProductos(result.data);
        } catch (err) {
            setError(err.message);
        }
    }, [isAdmin]);

    useEffect(() => { load(); }, [load]);

    async function addToCart(producto) {
        if (!isCustomer) {
            navigate('/login');
            return false;
        }
        try {
            setError('');
            setAviso('');
            await agregarAlCarrito(producto.id_producto, 1);
            setAviso(`${producto.nombre} se agregó al carrito.`);
            return true;
        } catch (err) { setError(err.message); }
        return false;
    }

    async function save(data) {
        try {
            setError('');
            if (editing) await updateProducto(editing.id_producto, data);
            else await createProducto(data);
            setEditing(null);
            await load();
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    }

    async function changeActive(producto) {
        const accion = producto.activo ? 'inactivar' : 'activar';
        if (!confirm(`¿Deseas ${accion} el producto "${producto.nombre}"?`)) return;
        try {
            setError('');
            await setProductoActivo(producto.id_producto, !producto.activo);
            await load();
        } catch (err) {
            setError(err.message);
        }
    }

    const categorias = useMemo(
        () => [...new Set(productos.map((producto) => producto.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
        [productos]
    );
    const productosVisibles = useMemo(() => {
        const termino = busqueda.trim().toLocaleLowerCase('es');
        const lista = productos.filter((producto) => {
            const coincideCategoria = !categoria || producto.categoria === categoria;
            const texto = `${producto.nombre} ${producto.marca || ''} ${producto.modelo || ''} ${producto.categoria}`.toLocaleLowerCase('es');
            return coincideCategoria && (!termino || texto.includes(termino));
        });
        if (ordenPrecio) lista.sort((a, b) => (Number(a.precio) - Number(b.precio)) * (ordenPrecio === 'desc' ? -1 : 1));
        return lista;
    }, [productos, categoria, busqueda, ordenPrecio]);

    return (
        <>
            <Navbar />
            <main className="container">
                <header className="page-header">
                    <h1>{isAdmin ? 'Administración de productos' : 'Catálogo de bicicletas y accesorios'}</h1>
                    <p>{isAdmin ? 'Administra el catálogo, precios y existencias.' : 'Explora productos disponibles para tu próxima salida.'}</p>
                </header>

                {error && <p className="error">{error}</p>}
                {aviso && <p className="success" role="status">{aviso}</p>}

                {isAdmin && <ProductForm editing={editing} onSubmit={save} onCancel={() => setEditing(null)} />}

                <div className="catalog-controls">
                    <label>Buscar producto
                        <input type="search" placeholder="Nombre, marca o modelo" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
                    </label>
                    <label>Categoría
                        <select value={categoria} onChange={(event) => setCategoria(event.target.value)}>
                            <option value="">Todas</option>
                            {categorias.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </label>
                    <label>Ordenar por precio
                        <select value={ordenPrecio} onChange={(event) => setOrdenPrecio(event.target.value)}>
                            <option value="">Recomendado</option>
                            <option value="asc">Menor a mayor</option>
                            <option value="desc">Mayor a menor</option>
                        </select>
                    </label>
                </div>

                <ProductGrid productos={productosVisibles} canManage={isAdmin} isCustomer={isCustomer} canShop={!isAdmin} onEdit={setEditing} onSetActive={changeActive} onAddToCart={addToCart} />
            </main>
        </>
    );
}

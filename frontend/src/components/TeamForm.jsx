import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ImagePlus, Plus, Save, X } from 'lucide-react';
import { urlImagen } from '../utils/format';

const empty = { nombre: '', descripcion: '', categoria: '', marca: '', modelo: '', precio: '', stock: '' };
const formatoMiles = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

function formatoPrecioInput(valor) {
    if (valor === '' || valor === null || valor === undefined) return '';
    const [entero, decimal] = String(valor).replace(',', '.').split('.');
    const numero = Number(entero);
    if (!Number.isFinite(numero)) return '';
    return `$ ${formatoMiles.format(numero)}${decimal !== undefined ? `,${decimal.slice(0, 2)}` : ''}`;
}

export default function ProductForm({ editing, onSubmit, onCancel }) {
    const [form, setForm] = useState(empty);
    const [precioInput, setPrecioInput] = useState('');
    const [imagenFile, setImagenFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [imagenesFiles, setImagenesFiles] = useState([]);
    const [imagenesPreview, setImagenesPreview] = useState([]);
    const [imagenesEliminar, setImagenesEliminar] = useState([]);
    const [eliminarImagenPrincipal, setEliminarImagenPrincipal] = useState(false);
    const fileInputRef = useRef(null);
    const additionalFilesRef = useRef(null);
    const priceInputRef = useRef(null);
    const formRef = useRef(null);
    const priceCursorAtEnd = useRef(false);

    useEffect(() => {
        setForm(editing ? {
            nombre: editing.nombre || '',
            descripcion: editing.descripcion || '',
            categoria: editing.categoria || '',
            marca: editing.marca || '',
            modelo: editing.modelo || '',
            precio: editing.precio ?? '',
            stock: editing.stock ?? ''
        } : empty);
        setPrecioInput(editing ? formatoPrecioInput(editing.precio) : '');
        setImagenFile(null);
        setPreview(editing ? urlImagen(editing.imagen) : null);
        setImagenesFiles([]);
        setImagenesPreview([]);
        setImagenesEliminar([]);
        setEliminarImagenPrincipal(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (additionalFilesRef.current) additionalFilesRef.current.value = '';
        if (editing) requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }, [editing]);

    useEffect(() => {
        if (!preview?.startsWith('blob:')) return undefined;
        return () => URL.revokeObjectURL(preview);
    }, [preview]);

    useEffect(() => () => imagenesPreview.forEach((image) => URL.revokeObjectURL(image.url)), [imagenesPreview]);

    useLayoutEffect(() => {
        if (!priceCursorAtEnd.current) return;
        const input = priceInputRef.current;
        input?.setSelectionRange(input.value.length, input.value.length);
        priceCursorAtEnd.current = false;
    }, [precioInput]);

    function change(event) {
        if (event.target.name === 'precio') {
            priceCursorAtEnd.current = event.target.selectionStart === event.target.value.length;
            const valor = event.target.value.replace(/[^\d,]/g, '');
            const [enteroOriginal = '', decimalOriginal] = valor.split(',');
            const entero = enteroOriginal.replace(/^0+(?=\d)/, '');
            const decimal = decimalOriginal?.slice(0, 2);
            const precio = `${entero}${decimalOriginal !== undefined ? `.${decimal}` : ''}`;
            setForm({ ...form, precio });
            setPrecioInput(valor ? `$ ${formatoMiles.format(Number(entero || 0))}${decimalOriginal !== undefined ? `,${decimal}` : ''}` : '');
            return;
        }
        setForm({ ...form, [event.target.name]: event.target.value });
    }

    function changeImagen(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        setImagenFile(file);
        setPreview(URL.createObjectURL(file));
        setEliminarImagenPrincipal(false);
    }

    function removeMainImage() {
        setPreview(null);
        setImagenFile(null);
        setEliminarImagenPrincipal(Boolean(editing?.imagen));
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    function removeAdditionalImage(idImagen) {
        setImagenesEliminar((actuales) => [...new Set([...actuales, idImagen])]);
    }

    function changeImagenes(event) {
        const files = Array.from(event.target.files || []).slice(0, 6);
        setImagenesFiles(files);
        setImagenesPreview(files.map((file) => ({ nombre: file.name, url: URL.createObjectURL(file) })));
    }

    async function submit(event) {
        event.preventDefault();
        const saved = await onSubmit({ ...form, precio: Number(form.precio), stock: Number(form.stock), imagenFile, imagenesFiles, imagenesEliminar, eliminarImagenPrincipal });
        if (!saved) return;
        setForm(empty);
        setPrecioInput('');
        setImagenFile(null);
        setPreview(null);
        setImagenesFiles([]);
        setImagenesPreview([]);
        setImagenesEliminar([]);
        setEliminarImagenPrincipal(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (additionalFilesRef.current) additionalFilesRef.current.value = '';
    }

    return (
        <form ref={formRef} onSubmit={submit} className="card form-grid product-editor-form">
            <h2>{editing ? 'Editar producto' : 'Registrar producto'}</h2>
            <input name="nombre" placeholder="Nombre del producto" value={form.nombre} onChange={change} required maxLength={150} />
            <input name="categoria" placeholder="Categoría" value={form.categoria} onChange={change} required maxLength={100} />
            <div className="product-form-row">
                <input ref={priceInputRef} name="precio" type="text" inputMode="decimal" placeholder="$ 0 COP" value={precioInput} onChange={change} required aria-label="Precio en pesos colombianos" />
                <input name="stock" type="number" min="0" step="1" placeholder="Existencias" value={form.stock} onChange={change} required />
            </div>
            <div className="product-form-row">
                <input name="marca" placeholder="Marca" value={form.marca} onChange={change} maxLength={100} />
                <input name="modelo" placeholder="Modelo" value={form.modelo} onChange={change} maxLength={100} />
            </div>
            <textarea name="descripcion" placeholder="Descripción del producto" value={form.descripcion} onChange={change} rows="3" />
            <label className="image-upload-field">
                <span><ImagePlus size={16} /> Imagen principal del producto</span>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={changeImagen} />
            </label>
            {preview && <div className="image-preview image-preview-removable"><img src={preview} alt="Vista previa del producto" /><button type="button" className="image-preview-remove" onClick={removeMainImage} aria-label="Quitar imagen principal" title="Quitar imagen principal"><X size={14} /></button></div>}
            {eliminarImagenPrincipal && <p className="image-removal-note">La imagen principal se eliminará al guardar los cambios.</p>}
            <label className="image-upload-field">
                <span><ImagePlus size={16} /> Imágenes adicionales (hasta 6)</span>
                <input ref={additionalFilesRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={changeImagenes} />
                <small>Las imágenes nuevas se agregarán debajo de la principal en los detalles.</small>
            </label>
            {(editing?.imagenes || []).length > 0 && <div className="image-gallery-preview">
                <p>Imágenes adicionales actuales</p>
                <div className="image-preview-list">
                    {editing.imagenes.filter((image) => !imagenesEliminar.includes(image.id_imagen)).map((image) => <div className="image-preview image-preview-removable" key={image.id_imagen}>
                        <img src={urlImagen(image.archivo)} alt="Imagen adicional actual" />
                        <button type="button" className="image-preview-remove" onClick={() => removeAdditionalImage(image.id_imagen)} aria-label="Eliminar esta imagen" title="Eliminar esta imagen"><X size={14} /></button>
                    </div>)}
                </div>
            </div>}
            {imagenesPreview.length > 0 && <div className="image-gallery-preview">
                <p>Imágenes seleccionadas</p>
                <div className="image-preview-list">
                    {imagenesPreview.map((image) => <div className="image-preview" key={image.url}><img src={image.url} alt={`Vista previa: ${image.nombre}`} /></div>)}
                </div>
            </div>}
            <div className="actions">
                <button type="submit" className={editing ? 'edit' : ''}>
                    {editing ? <Save size={16} /> : <Plus size={16} />}
                    {editing ? 'Guardar cambios' : 'Crear producto'}
                </button>
                {editing && <button type="button" className="secondary" onClick={onCancel}><X size={16} />Cancelar</button>}
            </div>
        </form>
    );
}

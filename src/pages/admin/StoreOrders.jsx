import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { ShoppingCart, CheckCircle, Clock, Search, ExternalLink, X, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useShop } from '../../context/ShopContext'

export default function StoreOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const navigate = useNavigate()
    const { customers } = useShop()

    useEffect(() => {
        const q = query(collection(db, "store_orders"), orderBy("createdAt", "desc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setOrders(data)
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    const filteredOrders = orders.filter(order => {
        const cInfo = customers.find(c => c.id === order.customerId || (order.customerEmail && c.email === order.customerEmail))
        const cName = cInfo?.name || order.customerName || 'Unknown Customer'

        const nameMatch = cName.toLowerCase().includes(searchTerm.toLowerCase())
        const orderIdMatch = order.id.toLowerCase().includes(searchTerm.toLowerCase())
        return nameMatch || orderIdMatch
    })

    const handleAcceptOrder = async (order) => {
        // You would typically redirect to Invoice Builder with the order details pre-filled
        // Or if you want an automated generation:
        alert("This feature will be fully integrated with Invoice Generation!")
        try {
            await updateDoc(doc(db, "store_orders", order.id), {
                status: 'fulfilled'
            })
        } catch (e) { console.error(e) }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this order?")) return;
        try {
            await deleteDoc(doc(db, "store_orders", id))
        } catch (e) { console.error(e) }
    }

    if (loading) return <div className="p-8"><div className="animate-pulse">Loading orders...</div></div>

    return (
        <div className="store-orders-page animate-fade-in">
            <header className="page-header mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <ShoppingCart className="text-blue-500" />
                        Online Orders
                    </h1>
                    <p className="text-gray-500 mt-1">Manage incoming orders from your Customer Store</p>
                </div>
            </header>

            <div className="card glass-card mb-6">
                <div className="flex items-center gap-4 bg-[var(--bg-input)] p-2 rounded-xl border border-[var(--border-color)] w-full max-w-md">
                    <Search className="text-gray-400 ml-2" size={20} />
                    <input
                        type="text"
                        placeholder="Search by customer name or order ID..."
                        className="bg-transparent border-none outline-none flex-1 text-sm py-1"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="card glass-card">
                <div className="table-responsive">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--border-color)]">
                                <th className="p-4 text-sm text-gray-400 font-bold uppercase">Order Info</th>
                                <th className="p-4 text-sm text-gray-400 font-bold uppercase">Customer</th>
                                <th className="p-4 text-sm text-gray-400 font-bold uppercase">Items</th>
                                <th className="p-4 text-sm text-gray-400 font-bold uppercase">Total</th>
                                <th className="p-4 text-sm text-gray-400 font-bold uppercase">Status</th>
                                <th className="p-4 text-sm text-gray-400 font-bold uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-400">
                                        No store orders found.
                                    </td>
                                </tr>
                            ) : filteredOrders.map(order => {
                                const matchedCustomer = customers.find(c => c.id === order.customerId || (order.customerEmail && c.email === order.customerEmail))
                                const customer = matchedCustomer || { name: order.customerName || 'Online Customer', isGST: false }
                                return (
                                    <tr key={order.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-input)] transition-colors">
                                        <td className="p-4">
                                            <div className="font-mono text-xs text-blue-500">{order.id.substring(0, 8).toUpperCase()}</div>
                                            <div className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold">{customer.name}</div>
                                            {customer.isGST && <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full uppercase font-bold">GST</span>}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm">{order.items?.length || 0} unique items</div>
                                        </td>
                                        <td className="p-4 font-bold text-gray-800 dark:text-gray-200">
                                            ₹{(order.total || 0).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            {order.status === 'pending' ? (
                                                <span className="flex items-center gap-1 text-orange-500 text-xs font-bold bg-orange-50 px-2 py-1 rounded-full w-max">
                                                    <Clock size={12} /> Pending
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full w-max">
                                                    <CheckCircle size={12} /> Fulfilled
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {order.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleAcceptOrder(order)}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                                                        title="Generate Invoice"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(order.id)}
                                                    className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-colors"
                                                    title="Delete Order"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

import { Search, ShoppingCart, Plus, Minus, Trash2, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getProductsWithPricing } from '../../services/db' // Import DB service
import { useShop } from '../../context/ShopContext'
import { useState, useEffect } from 'react'
import { db } from '../../lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { X } from 'lucide-react'

export default function Store() {
  const { globalSettings } = useShop()
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [showMobileCart, setShowMobileCart] = useState(false)

  useEffect(() => {
    async function fetchProducts() {
      if (user?.uid) {
        const data = await getProductsWithPricing(user.uid, user.email)
        setProducts(data)
        setLoading(false)
      }
    }
    fetchProducts()
  }, [user])

  // Filter products
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Cart Logic
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) }
      }
      return item
    }))
  }

  const cartTotal = cart.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * item.quantity), 0)

  const handleCheckout = async () => {
    if (!cart.length || !user) return;
    try {
      // Clean cart items to remove any undefined values which Firestore rejects
      const cleanCart = cart.map(item => {
        const cleanItem = { ...item };
        Object.keys(cleanItem).forEach(key => {
          if (cleanItem[key] === undefined) delete cleanItem[key];
        });
        return cleanItem;
      });

      await addDoc(collection(db, "store_orders"), {
        customerId: user.uid,
        customerEmail: user.email || '',
        customerName: user.name || user.displayName || 'Online Customer',
        items: cleanCart,
        total: Number((cartTotal * 1.18).toFixed(2)) || 0,
        status: 'pending',
        createdAt: new Date().toISOString()
      })
      alert("Order placed successfully!")
      setCart([])
    } catch (e) {
      console.error("Checkout failed", e)
      alert("Failed to place order: " + e.message)
    }
  }

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /> Loading Store...</div>

  if (globalSettings?.onlineStoreEnabled === false) {
    return (
      <div className="flex flex-col items-center justify-center p-20 glass-card">
        <ShoppingCart size={80} className="text-gray-300 mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Online Store is Temporarily Unavailable</h2>
        <p className="text-gray-500 mt-2 text-center max-w-md">Our online ordering portal is currently undergoing maintenance. Please contact your account manager directly for any urgent orders.</p>
        <button
          onClick={() => window.location.href = '/'}
          className="btn btn-primary mt-8 px-10"
        >
          Go Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="store-layout">
      {/* Product Grid Area */}
      <div className="product-area">
        <div className="standard-search-wrapper mb-6">
          <Search className="standard-search-icon" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-info-top">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="flex-1 font-bold m-0 line-clamp-2" style={{ fontSize: '0.95rem', minWidth: 0 }}>{product.name}</h4>
                  <div className="price-block flex-shrink-0 text-right">
                    <div className="price text-lg">₹{(parseFloat(product.price) || 0).toLocaleString()}</div>
                    {product.isCustomPrice && <span className="text-[10px] text-emerald-500 font-bold uppercase block mt-1">Pricing Set</span>}
                  </div>
                </div>
                <p className="sku mt-1 mb-0">{product.sku}</p>
              </div>
              <div className="product-meta mt-4 pt-3 border-t border-[var(--border-color)] flex justify-between items-center">
                <span className={`stock ${product.stock <= 0 ? 'bg-red-100 text-red-600' : (product.stock < 10 ? 'bg-orange-100 text-orange-600' : '')}`}>
                  {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
                </span>
                <button
                  className="btn btn-primary text-xs px-4 py-1.5 mx-0 my-0 rounded-lg whitespace-nowrap"
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                >
                  + Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className={`cart-sidebar card ${showMobileCart ? 'mobile-open' : ''}`}>
        <div className="cart-header">
          <h3>Your Order</h3>
          <div className="flex items-center gap-2">
            <span className="badge badge-primary">{cart.length} Items</span>
            <button className="mobile-only-btn close-cart" onClick={() => setShowMobileCart(false)}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <ShoppingCart size={48} />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <div className="item-price">₹{(parseFloat(item.price) || 0).toLocaleString()} x {item.quantity}</div>
                </div>
                <div className="item-actions">
                  <button onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                  <button className="del-btn" onClick={() => removeFromCart(item.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="total-row">
            <span>Subtotal</span>
            <span>₹{cartTotal.toLocaleString()}</span>
          </div>
          <div className="total-row">
            <span>GST (18%)</span>
            <span>₹{(cartTotal * 0.18).toLocaleString()}</span>
          </div>
          <div className="grand-total">
            <span>Total</span>
            <span>₹{(cartTotal * 1.18).toLocaleString()}</span>
          </div>
          <button className="btn btn-primary w-full" disabled={cart.length === 0} onClick={() => { handleCheckout(); setShowMobileCart(false); }}>
            Place Order
          </button>
        </div>
      </div>

      {/* Mobile Cart Floating Button */}
      {cart.length > 0 && (
        <button className="mobile-cart-toggle" onClick={() => setShowMobileCart(true)}>
          <ShoppingCart size={24} />
          <span className="cart-count-badge">{cart.length}</span>
        </button>
      )}

      {/* Mobile Cart Backdrop */}
      {showMobileCart && <div className="cart-backdrop" onClick={() => setShowMobileCart(false)} />}

      <style>{`
        .store-layout {
          display: grid;
          gap: 2rem;
          min-height: calc(100vh - 140px);
        }

        @media (min-width: 1024px) {
          .store-layout {
            grid-template-columns: 1fr 350px;
          }
        }
        
        .price-block {
            display: flex;
            align-items: center;
        }
        .ml-2 { margin-left: 0.5rem; }

        .product-area {
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 1rem;
        }

        .product-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.2s;
        }

        .product-card:hover {
          border-color: var(--primary);
          box-shadow: 0 8px 24px -10px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .product-info-top h4 {
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: var(--text-main);
        }

        .sku { color: var(--text-muted); font-size: 0.75rem; margin-bottom: 0; }

        .price { font-weight: 800; color: var(--text-main); font-size: 1.15rem; letter-spacing: -0.02em; }
        .stock { font-size: 0.7rem; font-weight: 800; color: #166534; background: #dcfce7; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        .stock.low { color: #991b1b; background: #fee2e2; }

        /* Cart Styles */
        .cart-sidebar {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 0;
          overflow: hidden;
        }

        .cart-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cart-items {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .empty-cart {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          gap: 1rem;
        }

        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px dashed #e2e8f0;
        }

        .item-details h4 {
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .item-price { font-size: 0.8rem; color: var(--text-muted); }

        .item-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .item-actions button {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          color: var(--text-muted);
        }

        .item-actions button:hover { background: #f1f5f9; color: var(--text-main); }
        .item-actions .del-btn:hover { background: #fee2e2; color: #dc2626; border-color: #fee2e2; }

        .cart-footer {
          padding: 1.5rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .grand-total {
          display: flex;
          justify-content: space-between;
          margin-top: 1rem;
          margin-bottom: 1.5rem;
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--color-primary);
        }

        .mb-6 { margin-bottom: 1.5rem; }
        .animate-spin { animation: spin 1s linear infinite; }

        .mobile-only-btn { display: none; }
        .mobile-cart-toggle { display: none; }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        @media (max-width: 640px) {
          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 0.75rem;
          }
          .product-card { padding: 1rem; }
          .price { font-size: 1.05rem; }
        }

        @media (max-width: 1024px) {
          .store-layout { grid-template-columns: 1fr; height: auto; }
          .cart-sidebar { 
            position: fixed; 
            top: 0; right: 0; bottom: 0; 
            width: 100%; max-width: 400px;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.3s, opacity 0.3s;
            visibility: hidden;
            opacity: 0;
            pointer-events: none;
            box-shadow: -10px 0 30px rgba(0,0,0,0.2);
          }
          .cart-sidebar.mobile-open { 
            transform: translateX(0); 
            visibility: visible;
            opacity: 1;
            pointer-events: all;
          }
          .mobile-only-btn { display: flex; }
          .close-cart { color: var(--text-muted); }
          
          .mobile-cart-toggle {
            display: flex;
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 60px;
            height: 60px;
            background: var(--color-primary);
            color: white;
            border-radius: 50%;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 900;
            border: none;
          }
          .cart-count-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #ef4444;
            color: white;
            font-size: 0.75rem;
            font-weight: 700;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
          }
          .cart-backdrop {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(4px);
            z-index: 950;
          }
        }
      `}</style>
    </div>
  )
}

import { LayoutDashboard, ShoppingCart, Package, BookOpen, Truck, ShoppingBag, Users, CreditCard, BarChart2, FileText, Settings } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard',  label: 'Home',    icon: LayoutDashboard },
    { id: 'pos',        label: 'POS',     icon: ShoppingCart    },
    { id: 'inventory',  label: 'Stock',   icon: Package         },
    { id: 'purchases',  label: 'Buy',     icon: ShoppingBag     },
    { id: 'khata',      label: 'Khata',   icon: BookOpen        },
    { id: 'suppliers',  label: 'Supply',  icon: Truck           },
    { id: 'employees',  label: 'Staff',   icon: Users           },
    { id: 'expenses',   label: 'Exp.',    icon: CreditCard      },
    { id: 'analytics',  label: 'Stats',   icon: BarChart2       },
    { id: 'reports',    label: 'Reports', icon: FileText        },
    { id: 'settings',   label: 'Set.',    icon: Settings        },
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className={`nav-tab-icon ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
              </div>
              <span className="nav-tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

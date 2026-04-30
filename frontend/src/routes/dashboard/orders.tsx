import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { FilterBar, SelectFilter } from '@/components/shared/FilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Modal } from '@/components/shared/Modal';
import type { Order, OrderStatus, DeliveryPerson } from '@/lib/types';
import { Eye, ChevronRight, Bike, MapPin, Loader } from 'lucide-react';
import { toast } from 'sonner';
import ordersService from '@/services/orders';
import deliveryTeamService from '@/services/delivery-team';

export const Route = createFileRoute('/dashboard/orders')({
  component: OrdersPage,
});

const dineInFlow: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'completed'];
const deliveryFlow: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'assigned', 'picked', 'out-for-delivery', 'delivered'];

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assignFor, setAssignFor] = useState<Order | null>(null);
  const [chosenDp, setChosenDp] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, teamData] = await Promise.all([
        ordersService.getAdminOrders(),
        deliveryTeamService.getDeliveryPersons(),
      ]);
      setOrders(ordersData);
      setDeliveryPersons(teamData);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load orders and delivery team');
    } finally {
      setLoading(false);
    }
  };

  const reselectFromList = (id: string) => orders.find(o => o.id === id) ?? null;
  const currentSelected = selectedOrder ? reselectFromList(selectedOrder.id) : null;

  const filtered = orders.filter(o => {
    if (search && !o.id.toLowerCase().includes(search.toLowerCase()) && !o.customerName.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && o.orderStatus !== statusFilter) return false;
    if (paymentFilter && o.paymentStatus !== paymentFilter) return false;
    return true;
  });

  const moveStatus = async (order: Order, status: OrderStatus) => {
    try {
      setIsUpdating(true);
      const updated = await ordersService.updateOrderStatus(order.id, status);
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      toast.success(`Order moved to ${status}`);
    } catch (err) {
      toast.error('Failed to update order status');
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const openAssign = (order: Order) => {
    setAssignFor(order);
    setChosenDp('');
  };

  const confirmAssign = async () => {
    if (!assignFor || !chosenDp) {
      toast.error('Pick a delivery person');
      return;
    }
    try {
      setIsUpdating(true);
      const updated = await ordersService.assignDeliveryPerson(assignFor.id, chosenDp);
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      toast.success('Order assigned to delivery person');
      setAssignFor(null);
      setSelectedOrder(null);
    } catch (err) {
      toast.error('Failed to assign delivery person');
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const flowFor = (o: Order) => o.diningType === 'delivery' ? deliveryFlow : dineInFlow;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <TopNavbar title="Orders" subtitle={`${filtered.length} orders`} />
      <div className="p-6">
        <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by order ID or customer...">
          <SelectFilter value={statusFilter} onChange={setStatusFilter} placeholder="All Status" options={[
            { value: 'pending', label: 'Pending' }, { value: 'accepted', label: 'Accepted' }, { value: 'preparing', label: 'Preparing' },
            { value: 'ready', label: 'Ready' }, { value: 'assigned', label: 'Assigned' }, { value: 'picked', label: 'Picked' },
            { value: 'out-for-delivery', label: 'Out for Delivery' }, { value: 'delivered', label: 'Delivered' },
            { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
          ]} />
          <SelectFilter value={paymentFilter} onChange={setPaymentFilter} placeholder="All Payment" options={[
            { value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Pending' }, { value: 'failed', label: 'Failed' }, { value: 'refunded', label: 'Refunded' },
          ]} />
        </FilterBar>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Order ID', 'Customer', 'Type', 'Items', 'Amount', 'Pay Status', 'Order Status', 'Delivery', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{order.id.slice(-6)}</td>
                    <td className="px-4 py-3 text-foreground">{order.customerName}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{order.diningType}</td>
                    <td className="px-4 py-3 text-muted-foreground">{order.items.length}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">&#8377;{order.totalAmount}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.paymentStatus} /></td>
                    <td className="px-4 py-3"><StatusBadge status={order.orderStatus} /></td>
                    <td className="px-4 py-3 text-xs">
                      {order.diningType === 'delivery'
                        ? (order.deliveryPersonName
                          ? <span className="inline-flex items-center gap-1 text-foreground"><Bike className="w-3 h-3 text-primary" />{order.deliveryPersonName}</span>
                          : <span className="text-muted-foreground">Unassigned</span>)
                        : <span className="text-muted-foreground">&mdash;</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedOrder(order)} className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        {order.diningType === 'delivery' && !order.deliveryPersonId && order.orderStatus !== 'cancelled' && (
                          <button
                            onClick={() => openAssign(order)}
                            className="h-8 px-2.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1"
                          >
                            <Bike className="w-3 h-3" /> Assign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={!!currentSelected} onClose={() => setSelectedOrder(null)} title={`Order ${currentSelected?.id.slice(-6) || ''}`} size="lg">
        {currentSelected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="text-sm font-medium text-foreground">{currentSelected.customerName}</p>
                <p className="text-xs text-muted-foreground">{currentSelected.customerPhone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-medium text-foreground capitalize">{currentSelected.diningType}</p>
              </div>
            </div>

            {currentSelected.deliveryAddress && (
              <div className="bg-info/5 border border-info/20 rounded-lg p-3 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-info mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Delivery Address</p>
                  <p className="text-sm text-foreground">{currentSelected.deliveryAddress}</p>
                </div>
              </div>
            )}

            {currentSelected.deliveryPersonName && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-2">
                <Bike className="w-4 h-4 text-primary" />
                <p className="text-sm text-foreground">Assigned to <span className="font-semibold">{currentSelected.deliveryPersonName}</span></p>
              </div>
            )}

            {currentSelected.notes && (
              <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm text-foreground">{currentSelected.notes}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground mb-2">Items</p>
              <div className="space-y-2">
                {currentSelected.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-muted/30 rounded-lg px-3 py-2">
                    <span className="text-sm text-foreground">{item.foodName} &times; {item.quantity}</span>
                    <span className="text-sm font-semibold text-foreground">&#8377;{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm font-semibold text-foreground">Total</span>
                  <span className="text-lg font-bold text-primary">&#8377;{currentSelected.totalAmount}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-3">Order Status</p>
              <div className="flex items-center gap-1">
                {flowFor(currentSelected).map((s, i) => {
                  const flow = flowFor(currentSelected);
                  const idx = flow.indexOf(currentSelected.orderStatus);
                  const active = i <= idx && currentSelected.orderStatus !== 'cancelled';
                  return (
                    <div key={s} className="flex items-center gap-1 flex-1">
                      <div className={`h-2 flex-1 rounded-full ${active ? 'bg-primary' : 'bg-muted'}`} />
                      {i < flow.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                {flowFor(currentSelected).map(s => (
                  <span key={s} className="text-[10px] text-muted-foreground capitalize">{s.replace(/-/g, ' ')}</span>
                ))}
              </div>
            </div>

            {!['delivered', 'completed', 'cancelled'].includes(currentSelected.orderStatus) && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => moveStatus(currentSelected, 'cancelled')} disabled={isUpdating} className="h-9 px-4 rounded-lg border border-destructive text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50">
                  Cancel
                </button>

                {currentSelected.diningType === 'delivery' && currentSelected.orderStatus === 'accepted' && (
                  <button onClick={() => moveStatus(currentSelected, 'preparing')} disabled={isUpdating} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                    Move to preparing
                  </button>
                )}

                {currentSelected.diningType === 'delivery'
                  && (currentSelected.orderStatus === 'pending' || currentSelected.orderStatus === 'preparing' || currentSelected.orderStatus === 'ready')
                  && !currentSelected.deliveryPersonId && (
                    <button onClick={() => openAssign(currentSelected)} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-1.5">
                      <Bike className="w-4 h-4" /> Assign to Delivery
                    </button>
                  )}

                {currentSelected.diningType !== 'delivery' && (() => {
                  const flow = flowFor(currentSelected);
                  const idx = flow.indexOf(currentSelected.orderStatus);
                  if (idx >= 0 && idx < flow.length - 1) {
                    const next = flow[idx + 1];
                    return (
                      <button onClick={() => moveStatus(currentSelected, next)} disabled={isUpdating} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                        Move to {next.replace(/-/g, ' ')}
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!assignFor} onClose={() => setAssignFor(null)} title={`Assign ${assignFor?.id.slice(-6) ?? ''} to Delivery Person`} size="md">
        {assignFor && (
          <div className="space-y-4">
            {assignFor.deliveryAddress && (
              <div className="bg-info/5 border border-info/20 rounded-lg p-3 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-info mt-0.5" />
                <p className="text-sm text-foreground">{assignFor.deliveryAddress}</p>
              </div>
            )}

            <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin">
              {deliveryPersons.filter(d => d.status === 'active').map(d => (
                <label key={d.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${chosenDp === d.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/30'}`}>
                  <input type="radio" name="dp" checked={chosenDp === d.id} onChange={() => setChosenDp(d.id)} className="accent-primary" />
                  <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">
                    {d.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{d.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{d.phone}</p>
                  </div>
                </label>
              ))}
              {deliveryPersons.filter(d => d.status === 'active').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No active delivery persons. Add one in Delivery Team.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAssignFor(null)} className="h-10 px-4 rounded-lg border border-input text-sm font-medium hover:bg-accent">Cancel</button>
              <button onClick={confirmAssign} disabled={isUpdating} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                {isUpdating ? <Loader className="w-4 h-4 animate-spin" /> : 'Dispatch Order'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

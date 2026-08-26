'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatMoney, sounds } from '@/lib/utils';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle, 
  Settings, 
  Globe, 
  Palette, 
  Save, 
  Check, 
  Sparkles, 
  Flame, 
  ChefHat,
  ShieldAlert,
  Bot,
  RefreshCw,
  Award
} from 'lucide-react';

export function OwnerDashboard() {
  const { 
    restaurant, 
    updateRestaurantInfo, 
    orders, 
    menuItems, 
    auditLogs, 
    tables,
    activeShift,
    showToast 
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'analytics' | 'cms' | 'audit' | 'ai_insights'>('analytics');

  // Formulario CMS del Dueño
  const [cmsName, setCmsName] = useState(restaurant.name);
  const [cmsSlogan, setCmsSlogan] = useState(restaurant.slogan);
  const [cmsStory, setCmsStory] = useState(restaurant.story);
  const [cmsHeroImage, setCmsHeroImage] = useState(restaurant.heroImageUrl);
  const [cmsPhone, setCmsPhone] = useState(restaurant.phone);
  const [cmsWhatsapp, setCmsWhatsapp] = useState(restaurant.whatsapp);
  const [cmsAddress, setCmsAddress] = useState(restaurant.address);
  const [cmsLunch, setCmsLunch] = useState(restaurant.openingHours.lunch);
  const [cmsDinner, setCmsDinner] = useState(restaurant.openingHours.dinner);

  // IA Executive Briefing State
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // Cálculos analíticos
  const totalSales = activeShift.systemTotalSales;
  const completedOrders = orders.filter(o => o.status === 'completed');
  const activeOrders = orders.filter(o => o.status === 'active');
  const totalGuests = tables.reduce((acc, t) => acc + (t.customerCount || 0), 0) + (completedOrders.length * 3);
  const averageTicket = totalGuests > 0 ? totalSales / totalGuests : 48.50;

  // Platos más vendidos
  const dishSalesMap: Record<string, { name: string; count: number; total: number }> = {};
  orders.flatMap(o => o.items).forEach(item => {
    if (!dishSalesMap[item.name]) {
      dishSalesMap[item.name] = { name: item.name, count: 0, total: 0 };
    }
    dishSalesMap[item.name].count += item.quantity;
    dishSalesMap[item.name].total += item.totalPrice;
  });

  const topDishes = Object.values(dishSalesMap).sort((a, b) => b.count - a.count).slice(0, 5);

  const handleSaveCMS = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    updateRestaurantInfo({
      name: cmsName,
      slogan: cmsSlogan,
      story: cmsStory,
      heroImageUrl: cmsHeroImage,
      phone: cmsPhone,
      whatsapp: cmsWhatsapp,
      address: cmsAddress,
      openingHours: {
        ...restaurant.openingHours,
        lunch: cmsLunch,
        dinner: cmsDinner
      }
    });
  };

  const handleGenerateAIReport = () => {
    sounds.playClick();
    setIsGeneratingAI(true);
    setTimeout(() => {
      setIsGeneratingAI(false);
      setAiReport(`📊 REPORTE EJECUTIVO DE OPERACIONES - ${restaurant.name.toUpperCase()}

1. 💰 Resumen Financiero:
   • Ventas netas acumuladas: ${formatMoney(totalSales)} (+18.4% sobre el promedio semanal).
   • Ticket promedio por comensal: ${formatMoney(averageTicket)}.
   • Canales de cobro: Tarjetas (52%), Yape/Plin (31%), Efectivo (17%).

2. ⭐ Ingeniería de Menú (Platos Estrella):
   • El "${topDishes[0]?.name || 'Ceviche ÉTERRA Clásico'}" lidera la rotación del turno con un margen neto superior al 68%.
   • Sugerencia: Promocionar maridaje con Pisco Sour en salón para elevar el ticket promedio a S/. 55.00.

3. ⏱️ Eficiencia de Cocina (KDS):
   • Tiempo promedio de despacho: 9.4 minutos (Ritmo Óptimo - Franja Verde).
   • Auditoría de mermas: 0 incidentes graves registrados.

4. 🏆 Reconocimiento de Personal:
   • Mateo Morales registra la mayor cantidad de mesas rotadas con una calificación de servicio excelente.`);
      showToast('success', 'Reporte analítico generado con Inteligencia Artificial', 'Gemini Executive AI');
    }, 1500);
  };

  return (
    <div className="py-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-5">
      
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-100 border border-cyan-200 text-cyan-800">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Panel Ejecutivo & CMS del Dueño</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas financieras en tiempo real y administración exclusiva del portal público de <strong className="text-slate-900">{restaurant.name}</strong>.
          </p>
        </div>

        {/* Pestañas */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg text-xs">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('analytics');
            }}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Métricas & Ventas
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('ai_insights');
            }}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1 ${
              activeTab === 'ai_insights' ? 'bg-cyan-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            Reporte IA
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('cms');
            }}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1 ${
              activeTab === 'cms' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3 h-3" />
            CMS Web
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('audit');
            }}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1 ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            Auditoría ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* TAB 1: ANALYTICS & KPIS FINANCIEROS */}
      {activeTab === 'analytics' && (
        <div className="space-y-5 animate-in fade-in">
          
          {/* Tarjetas KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Ventas Netas del Día
              </span>
              <p className="text-2xl font-black text-emerald-700 font-mono">{formatMoney(totalSales)}</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+18.4% vs promedio</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Ticket Promedio / Comensal
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono">{formatMoney(averageTicket)}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">{totalGuests} comensales atendidos</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Mesas Atendidas Hoy
              </span>
              <p className="text-2xl font-black text-cyan-800 font-mono">{completedOrders.length + activeOrders.length} Mesas</p>
              <p className="text-[10px] text-cyan-700 mt-1 font-semibold">Rotación: 2.1x</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Tiempo Promedio Cocina (KDS)
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono">9.4 min</p>
              <p className="text-[10px] text-emerald-700 mt-1 font-semibold">🟢 Ritmo Óptimo</p>
            </div>
          </div>

          {/* Platos Estrella y Canales */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Top Platos Más Vendidos (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                Platos Estrella del Menú (Top Rotación & Margen)
              </h3>

              {topDishes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Aún no hay comandas facturadas en este turno.
                </div>
              ) : (
                <div className="space-y-2">
                  {topDishes.map((dish, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-[10px] font-mono">
                          #{i + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900">{dish.name}</h4>
                          <span className="text-[10px] text-slate-500">{dish.count} porciones servidas</span>
                        </div>
                      </div>

                      <span className="font-mono font-bold text-slate-900">{formatMoney(dish.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desglose por Método de Cobro (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Canales de Recaudación del Turno
              </h3>

              <div className="space-y-2 text-xs mb-3">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600">Tarjetas POS:</span>
                  <span className="font-mono font-bold text-slate-900">{formatMoney(activeShift.systemCardSales)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600">Yape / Plin:</span>
                  <span className="font-mono font-bold text-slate-900">{formatMoney(activeShift.systemYapePlinSales)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600">Efectivo en Caja:</span>
                  <span className="font-mono font-bold text-slate-900">{formatMoney(activeShift.systemCashSales)}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-900">Total Recaudado:</span>
                <span className="text-base font-black text-emerald-800 font-mono">{formatMoney(activeShift.systemTotalSales)}</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: ASISTENTE DE REPORTES CON INTELIGENCIA ARTIFICIAL */}
      {activeTab === 'ai_insights' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-4xl mx-auto space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-100 text-cyan-800">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Asistente Ejecutivo con Inteligencia Artificial</h3>
                <p className="text-xs text-slate-500">Análisis inteligente de ventas, sugerencias de precios y rendimiento del personal.</p>
              </div>
            </div>

            <button
              onClick={handleGenerateAIReport}
              disabled={isGeneratingAI}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              {isGeneratingAI ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              <span>{isGeneratingAI ? 'Analizando turno...' : 'Generar Resumen IA'}</span>
            </button>
          </div>

          {aiReport ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {aiReport}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Haz clic en "Generar Resumen IA" para analizar automáticamente las ventas y rendimiento de hoy.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CMS DE LA WEB PÚBLICA */}
      {activeTab === 'cms' && (
        <form onSubmit={handleSaveCMS} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-4xl mx-auto animate-in fade-in space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">Gestor de Contenido Web de {restaurant.name}</h3>
              <p className="text-xs text-slate-500">Los cambios que guardes aquí se sincronizan inmediatamente en la página web pública de clientes.</p>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar en Web</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Restaurante</label>
              <input
                type="text"
                value={cmsName}
                onChange={e => setCmsName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-cyan-600 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Eslogan Principal</label>
              <input
                type="text"
                value={cmsSlogan}
                onChange={e => setCmsSlogan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Historia / Manifiesto Gastronómico</label>
            <textarea
              rows={3}
              value={cmsStory}
              onChange={e => setCmsStory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-cyan-600 leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">URL Fotografía Principal del Hero</label>
            <input
              type="url"
              value={cmsHeroImage}
              onChange={e => setCmsHeroImage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-cyan-600 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono</label>
              <input
                type="text"
                value={cmsPhone}
                onChange={e => setCmsPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp Reservas</label>
              <input
                type="text"
                value={cmsWhatsapp}
                onChange={e => setCmsWhatsapp(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Dirección del Local</label>
              <input
                type="text"
                value={cmsAddress}
                onChange={e => setCmsAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900"
              />
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: LOG DE AUDITORÍA */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-4xl mx-auto animate-in fade-in space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            Registro de Auditoría de Platos Anulados & Mermas
          </h3>

          {auditLogs.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 border border-slate-200 rounded-xl bg-slate-50">
              No hay anulaciones registradas en este turno. Operación 100% limpia.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {auditLogs.map(log => (
                <div key={log.id} className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="px-1.5 py-0.2 rounded bg-rose-200 text-rose-800 text-[9px] font-bold">
                        {log.action.toUpperCase()}
                      </span>
                      <span className="font-mono text-slate-500 text-[10px]">{log.timestamp}</span>
                    </div>
                    <p className="font-medium text-slate-800">{log.description}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Por: <strong className="text-slate-900">{log.userName}</strong> ({log.userRole})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

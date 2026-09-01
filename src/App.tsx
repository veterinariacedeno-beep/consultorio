import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import Layout, { type ActiveView } from './components/Layout';
import Dashboard from './components/Dashboard';
import ClientsModule from './components/clients/ClientsListModule';
import ServicesList from './components/services/ServicesList';
import BillingModule from './components/billing/BillingModule';
import AppointmentsModule from './components/appointments/AppointmentsModule';
import PharmacyModule from './components/pharmacy/PharmacyModule';
import ExpensesModule from './components/expenses/ExpensesModule';
import DebtsModule from './components/debts/DebtsModule';
import WeeklyRecordModule from './components/weekly/WeeklyRecordModule';
import FinancialReportModule from './components/financial/FinancialReportModule';
import LaboratoryModule from './components/laboratorio/LaboratoryModule';
import CertificadosModule from './components/certificados/CertificadosModule';

function AppInner() {
  const { loading } = useApp();
  const [view, setView] = useState<ActiveView>('dashboard');

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          <p className="text-sm font-semibold text-slate-600">Cargando datos del consultorio...</p>
        </div>
      </div>
    );
  }

  function renderView() {
    switch (view) {
      case 'dashboard':
        return <Dashboard />;
      case 'appointments':
        return <AppointmentsModule />;
      case 'clients':
        return <ClientsModule />;
      case 'services':
        return <ServicesList />;
      case 'billing':
        return <BillingModule />;
      case 'pharmacy':
        return <PharmacyModule />;
      case 'expenses':
        return <ExpensesModule />;
      case 'debts':
        return <DebtsModule />;
      case 'weekly':
        return <WeeklyRecordModule />;
      case 'financial-report':
        return <FinancialReportModule />;
      case 'laboratorio':
        return <LaboratoryModule />;
      case 'certificados':
        return <CertificadosModule />;
    }
  }

  return (
    <Layout active={view} onNavigate={setView}>
      {renderView()}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

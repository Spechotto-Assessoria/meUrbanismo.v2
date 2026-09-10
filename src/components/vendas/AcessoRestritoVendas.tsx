import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../tabs/ui-components';

export const AcessoRestritoVendas: React.FC = () => (
  <div className="max-w-lg mx-auto my-12 animate-fadeIn">
    <Card className="text-center">
      <CardHeader>
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 mb-2">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <CardTitle className="text-base">Acesso Restrito à Equipe Comercial</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-slate-500 leading-relaxed">
          O simulador de vendas e a emissão de propostas são exclusivos para corretores,
          proprietários e administradores do empreendimento.
        </p>
      </CardContent>
    </Card>
  </div>
);

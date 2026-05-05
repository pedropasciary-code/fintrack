'use client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { fmtBRL } from '@/lib/supabase'

type CatItem = { name: string; value: number; color: string }
type BarItem  = { name: string; Ganhos: number; Gastos: number }

export default function DashboardCharts({
  catData,
  barData,
}: {
  catData: CatItem[]
  barData: BarItem[]
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="card p-5">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
          Gastos por categoria
        </h3>
        {catData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Sem gastos este mês</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={catData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={2}
              >
                {catData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmtBRL(v)} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card p-5">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
          Evolução mensal
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} barCategoryGap="30%">
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip formatter={(v: number) => fmtBRL(v)} />
            <Bar dataKey="Ganhos" fill="#1D9E75" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Gastos"  fill="#F0997B" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

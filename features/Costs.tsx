// src/features/Costs.tsx
import React, { useMemo, useState } from "react";
import { useData } from "../context/DataContext.tsx";
import Button from "../components/ui/Button.tsx";
import Modal from "../components/Modal.tsx";
import Input from "../components/ui/Input.tsx";
import Select from "../components/ui/Select.tsx";
import { Cost } from "../types.ts";

// categorias reais do backend
type Category = "channel" | "payment" | "tax" | "other";

const TABS: { key: Category; label: string }[] = [
  { key: "channel", label: "Canais de Venda" },
  { key: "payment", label: "Meios de Pagamento" },
  { key: "tax", label: "Impostos" },
  { key: "other", label: "Outros Custos" },
];

const CurrencyOrPercent: React.FC<{ value: number; isPct: boolean }> = ({
  value,
  isPct,
}) => (
  <span>{isPct ? `${value.toFixed(2)}%` : `R$ ${value.toFixed(2)}`}</span>
);

const CostsPage: React.FC = () => {
  const { costs, addCost, updateCost, deleteCost } = useData();
  const [active, setActive] = useState<Category>("channel");

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Cost> | null>(null);

  const list = useMemo(
    () =>
      costs
        .filter((c) => (c as any)?.category === active)
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [costs, active]
  );

  const openNew = () => {
    setEditing({
      name: "",
      value: 0,
      isPercentage: false,
      category: active,
    } as Partial<Cost>);
    setIsOpen(true);
  };

  const openEdit = (c: Cost) => {
    setEditing({ ...c });
    setIsOpen(true);
  };

  const close = () => {
    setEditing(null);
    setIsOpen(false);
  };

  const save = async () => {
    if (!editing?.name) return alert("Nome é obrigatório");

    const payload = {
      name: String(editing.name),
      value: Number(editing.value) || 0,
      isPercentage: Boolean(editing.isPercentage),
      category: (editing.category || active) as Category,
    };

    try {
      if (editing.id) {
        await updateCost({ ...(editing as Cost), ...payload });
      } else {
        await addCost(payload as Omit<Cost, "id">);
      }
      close();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Falha ao salvar o custo.");
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Excluir este custo?")) return;
    try {
      await deleteCost(id);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Falha ao excluir o custo.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-espresso">Custos Operacionais</h1>

      {/* Tabs */}
      <div className="border-b border-lino">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`${
                active === t.key
                  ? "border-oliva text-oliva"
                  : "border-transparent text-oliva hover:text-espresso hover:border-lino"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex justify-end">
        <Button onClick={openNew}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Adicionar
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-crema shadow-md rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left text-oliva">
          <thead className="text-xs text-espresso uppercase bg-lino">
            <tr>
              <th className="px-6 py-3">Nome</th>
              <th className="px-6 py-3">Valor</th>
              <th className="px-6 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="bg-crema border-b border-lino hover:bg-lino">
                <td className="px-6 py-4 font-medium text-espresso">{c.name}</td>
                <td className="px-6 py-4">
                  <CurrencyOrPercent value={Number(c.value) || 0} isPct={!!c.isPercentage} />
                </td>
                <td className="px-6 py-4 flex items-center space-x-2">
                  <Button variant="secondary" onClick={() => openEdit(c)} className="!p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"
                      />
                    </svg>
                  </Button>
                  <Button variant="danger" onClick={() => onDelete(c.id)} className="!p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </Button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td className="px-6 py-6 text-oliva" colSpan={3}>
                  Nenhum custo nesta categoria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onClose={close}
        title={editing?.id ? "Editar Custo" : "Adicionar Custo"}
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            value={editing?.name || ""}
            onChange={(e) => setEditing((p) => ({ ...p!, name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Valor"
              type="number"
              value={editing?.value ?? ""}
              onChange={(e) =>
                setEditing((p) => ({ ...p!, value: parseFloat(e.target.value) || 0 }))
              }
            />
            <label className="flex items-end gap-2">
              <input
                type="checkbox"
                checked={!!editing?.isPercentage}
                onChange={(e) =>
                  setEditing((p) => ({ ...p!, isPercentage: e.target.checked }))
                }
              />
              <span>É porcentagem?</span>
            </label>
          </div>
          <Select
            label="Categoria"
            value={(editing?.category as Category) || active}
            onChange={(e) =>
              setEditing((p) => ({ ...p!, category: e.target.value as Category }))
            }
          >
            {TABS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </Select>

          <Button onClick={save}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Salvar
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CostsPage;

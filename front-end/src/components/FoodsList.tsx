import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { Food } from '../types/Food'
import { apiFetch, apiGet, getErrorMessage } from '../utils/api'
import { formatNumber, formatPortion } from '../utils/format'

export function FoodsList() {
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function fetchData() {
    setLoading(true)
    try {
      setFoods(await apiGet<Food[]>('/foods'))
    }
    catch (error) {
      if (error instanceof Error) {
        window.alert('ERRO: ' + error.message)
      }
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function handleDelete(food: Food) {
    if (!window.confirm(`Deseja realmente excluir o alimento ${food.name}?`)) return

    try {
      const response = await apiFetch(`/foods/${food.id}`, { method: 'DELETE' })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      window.alert('Alimento excluído com sucesso.')
      fetchData()
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido.'
      window.alert(`Não foi possível excluir o alimento. ${message}`)
    }
  }

  const term = search.trim().toLowerCase()
  const filtered = foods.filter(food => food.name.toLowerCase().includes(term))

  return (
    <>
      <div className="ns-page-header">
        <div>
          <h1>Banco de alimentos</h1>
          <p className="text-secondary mb-0">Valores por porção de referência.</p>
        </div>

        <Link to="/alimentos/new" className="btn btn-primary">
          Novo alimento
        </Link>
      </div>

      <div className="mb-3" style={{ maxWidth: 420 }}>
        <label htmlFor="food-search" className="visually-hidden">Buscar alimento</label>
                <input
          id="food-search"
          type="search"
          className="form-control"
          placeholder="Buscar alimento"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>

      {loading && <p role="status">Aguarde, carregando...</p>}

      <div className="ns-table-wrapper table-responsive">
        <table className="table table-hover align-middle ns-table">
          <thead>
            <tr>
              <th scope="col">Alimento</th>
              <th scope="col">Porção</th>
              <th scope="col" className="text-end">kcal</th>
              <th scope="col" className="text-end">Prot. (g)</th>
              <th scope="col" className="text-end">Carb. (g)</th>
              <th scope="col" className="text-end">Gord. (g)</th>
              <th scope="col" className="text-end">Fibras (g)</th>
              <th scope="col">Origem</th>
              <th scope="col" className="text-end">Ações</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(food => (
              <tr key={food.id}>
                <td className="fw-semibold">{food.name}</td>
                <td className="text-nowrap">{formatPortion(food)}</td>
                <td className="text-end">{formatNumber(food.calories)}</td>
                <td className="text-end">{formatNumber(food.protein, 1)}</td>
                <td className="text-end">{formatNumber(food.carbohydrates, 1)}</td>
                <td className="text-end">{formatNumber(food.fat, 1)}</td>
                <td className="text-end">{formatNumber(food.fiber, 1)}</td>
                <td>
                  <span className={food.isDefault ? 'ns-badge-inactive' : 'ns-badge-active'}>
                    {food.isDefault ? 'Base padrão' : 'Cadastrado por você'}
                  </span>
                </td>
                <td className="text-end text-nowrap">
                  <Link
                    to={`/alimentos/${food.id}`}
                    className="btn btn-sm btn-outline-primary me-2"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(food)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-secondary py-4">
                  {foods.length === 0 ? 'Nenhum alimento cadastrado.' : 'Nenhum alimento encontrado.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

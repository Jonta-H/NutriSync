import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import type { Patient } from '../types/Patient'
import type { Diet } from '../types/Diet'
import type { Food } from '../types/Food'
import type { BodyAssessment } from '../types/BodyAssessment'
import { apiGet } from '../utils/api'
import { formatCpf, formatDate, formatNumber, getInitials } from '../utils/format'

type DashboardData = {
  patients: Patient[];
  diets: Diet[];
  foods: Food[];
  assessments: BodyAssessment[];
}

function StatCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="ns-card h-100">
      <span className="ns-stat-label">{label}</span>
      <div className="ns-stat-value">{formatNumber(value)}</div>
      <div className="small text-secondary">{detail}</div>
    </div>
  )
}

export function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData>({ patients: [], diets: [], foods: [], assessments: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function fetchData(active: boolean) {
    try {
      // As quatro listagens são buscadas em paralelo
      const [patients, diets, foods, assessments] = await Promise.all([
        apiGet<Patient[]>('/patients'),
        apiGet<Diet[]>('/diets'),
        apiGet<Food[]>('/foods'),
        apiGet<BodyAssessment[]>('/body-assessments'),
      ])

      if (active) setData({ patients, diets, foods, assessments })
    }
    catch (error) {
      if (active && error instanceof Error) {
        window.alert('ERRO: ' + error.message)
      }
    }
    finally {
      if (active) setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    fetchData(active)
    return () => {
      active = false
    }
  }, [])

  const { patients, diets, foods, assessments } = data

  // Avaliações do mês corrente (as datas vêm em UTC)
  const now = new Date()
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long' })
  const assessmentsThisMonth = assessments.filter(assessment => {
    const date = new Date(assessment.assessmentDate)
    return date.getUTCFullYear() === now.getFullYear() && date.getUTCMonth() === now.getMonth()
  })
  // A listagem de avaliações já vem ordenada da mais recente para a mais antiga
  const lastAssessment = assessments[0]

  const activePatients = patients.filter(patient => patient.active)
  const customFoods = foods.filter(food => !food.isDefault).length

  // Pacientes com avaliação, do atendimento mais recente para o mais antigo
  const assessedPatients = patients
    .filter(patient => patient.latestAssessment)
    .sort((a, b) => b.latestAssessment!.assessmentDate.localeCompare(a.latestAssessment!.assessmentDate))

  const maxTee = Math.max(...assessedPatients.map(patient => patient.latestAssessment!.tee), 1)

  const term = search.trim().toLowerCase()
  const digits = term.replace(/\D/g, '')
  const searchResults = term
    ? patients.filter(patient =>
        patient.name.toLowerCase().includes(term) || (digits !== '' && patient.cpf.includes(digits))
      ).slice(0, 5)
    : []

  return (
    <>
      <div className="ns-page-header">
        <div>
          <h1>Painel</h1>
          <p className="text-secondary mb-0">Bem-vinda de volta, {user?.name}.</p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Link to="/pacientes/new" className="btn btn-primary">
            Novo Paciente
          </Link>
          <Link to="/dietas/new" className="btn btn-outline-primary">
            Novo modelo de dieta
          </Link>
        </div>
      </div>

      <div className="position-relative mb-4">
        <label htmlFor="quick-search" className="visually-hidden">Busca rápida de pacientes</label>
                <input
          id="quick-search"
          type="search"
          className="form-control form-control-lg"
          placeholder="Busca rápida de pacientes"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />

        {term && (
          <div className="ns-card position-absolute w-100 mt-1 py-1 shadow-sm" style={{ zIndex: 10 }}>
            {searchResults.map(patient => (
              <Link key={patient.id} to={`/pacientes/${patient.id}`} className="ns-list-row">
                <span className="ns-avatar">{getInitials(patient.name)}</span>
                <span>
                  <span className="ns-list-name fw-semibold d-block">{patient.name}</span>
                  <span className="small text-secondary">{formatCpf(patient.cpf)}</span>
                </span>
              </Link>
            ))}
            {searchResults.length === 0 && (
              <p className="text-secondary my-2">Nenhum paciente encontrado.</p>
            )}
          </div>
        )}
      </div>

      {loading && <p role="status">Aguarde, carregando...</p>}

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <StatCard
            label="Total de Pacientes"
            value={patients.length}
            detail={`${activePatients.length} ${activePatients.length === 1 ? 'ativo' : 'ativos'}`}
          />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard
            label={`Avaliações em ${monthName}`}
            value={assessmentsThisMonth.length}
            detail={lastAssessment ? `última em ${formatDate(lastAssessment.assessmentDate)}` : 'nenhuma avaliação registrada'}
          />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard label="Modelos de Dieta" value={diets.length} detail="templates prontos" />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard
            label="Alimentos cadastrados"
            value={foods.length}
            detail={`${customFoods} ${customFoods === 1 ? 'adicionado' : 'adicionados'} por você`}
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <section className="ns-card h-100">
            <h2 className="ns-card-title">Gasto Energético Total por paciente</h2>

            {assessedPatients.map(patient => {
              const tee = patient.latestAssessment!.tee
              return (
                <div key={patient.id} className="mb-3">
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="fw-semibold">{patient.name}</span>
                    <span className="text-secondary">{formatNumber(tee)} kcal</span>
                  </div>
                  <div
                    className="ns-bar-track"
                    role="img"
                    aria-label={`${patient.name}: ${formatNumber(tee)} kcal`}
                  >
                    <div
                      className={`ns-bar-fill ${patient.active ? '' : 'inactive'}`}
                      style={{ width: `${(tee / maxTee) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}

            {!loading && assessedPatients.length === 0 && (
              <p className="text-secondary mb-0">Nenhum paciente avaliado ainda.</p>
            )}
          </section>
        </div>

        <div className="col-12 col-xl-5">
          <section className="ns-card h-100">
            <h2 className="ns-card-title">Últimos atendidos</h2>

            {assessedPatients.slice(0, 5).map(patient => {
              const assessment = patient.latestAssessment!
              return (
                <Link key={patient.id} to={`/pacientes/${patient.id}`} className="ns-list-row">
                  <span className="ns-avatar">{getInitials(patient.name)}</span>
                  <span className="flex-grow-1 overflow-hidden">
                    <span className="ns-list-name fw-semibold d-block text-truncate">{patient.name}</span>
                    <span className="small text-secondary">
                      IMC {formatNumber(assessment.bmi, 1)} · GET {formatNumber(assessment.tee)} kcal · {formatDate(assessment.assessmentDate)}
                    </span>
                  </span>
                  <span className={patient.active ? 'ns-badge-active' : 'ns-badge-inactive'}>
                    {patient.active ? 'Ativo' : 'Inativo'}
                  </span>
                </Link>
              )
            })}

            {!loading && assessedPatients.length === 0 && (
              <p className="text-secondary mb-0">Nenhum atendimento registrado.</p>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

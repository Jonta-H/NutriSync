# NutriSync

Aplicação web para a prática clínica da nutricionista autônoma: cadastro de pacientes com cálculos antropométricos automáticos (IMC, TMB, GET e água), banco de alimentos e modelos de dieta com totais nutricionais calculados.

Projeto da UCE (Uni-FACEF, 2026/2), desenvolvido nas disciplinas de Paradigmas de Programação.

## Estrutura do repositório

| Pasta | Conteúdo | Stack |
| --- | --- | --- |
| [`back-end/`](back-end) | API REST | Node.js, Express 5, Prisma ORM 7, PostgreSQL, TypeScript |
| [`front-end/`](front-end) | Interface web | React 19, Vite, TypeScript, Bootstrap 5, React Router |

## Como executar

Pré-requisitos: Node.js 22+ e um PostgreSQL acessível.

### 1. Back-end

```bash
cd back-end
cp .env.example .env        # ajuste DATABASE_URL, ALLOWED_ORIGINS e JWT_SECRET
npm install
npx prisma migrate deploy   # cria as tabelas
npx prisma generate         # gera o Prisma Client
npx prisma db seed          # usuário de demonstração, alimentos, pacientes e modelos
npm run dev                 # API em http://localhost:8888
```

### 2. Front-end

```bash
cd front-end
cp .env.local.example .env.local   # VITE_API_BASE aponta para a API
npm install
npm run dev                        # interface em http://localhost:5173
```

Acesse com o usuário criado pelo seed: login **nutri**, senha **nutri123**.

## Funcionalidades desta entrega

- **Login** com token JWT; todas as rotas da API, exceto o login, exigem o token.
- **Painel** com indicadores (pacientes, avaliações do mês, modelos de dieta, alimentos), busca rápida, Gasto Energético Total por paciente e últimos atendidos.
- **Pacientes**: listagem com busca e filtro por status, cadastro, edição e exclusão. A meta diária (GET e água) vem da última avaliação corporal.
- **Prontuário** do paciente: dados pessoais, indicadores atuais (IMC, TMB, GET e água, com variação de peso), histórico de avaliações corporais e planos alimentares atribuídos.
- **Avaliações corporais**: registro e edição com IMC, água, TMB e GET calculados enquanto se digita; listagem geral em `/avaliacoes`.
- **Planos alimentares**: plano do paciente criado do zero ou a partir de um modelo de dieta (refeições copiadas e ajustáveis), com total comparado ao GET.
- **Alimentos**: banco de alimentos com valores por porção; cadastro, edição e exclusão.
- **Dietas (modelos)**: modelos com refeições e alimentos, totais de energia e macronutrientes calculados em tempo real; cadastro, edição e exclusão.

## Rotas da API

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/auth/login` | Autentica e devolve `{ token, user }` |
| GET | `/auth/me` | Dados do usuário logado |
| GET, POST | `/patients` | Lista (com idade e indicadores da última avaliação) / cadastra |
| GET, PUT, DELETE | `/patients/:id` | Busca / atualiza / exclui |
| GET, POST | `/body-assessments` | Lista / cadastra avaliações corporais (com IMC, TMB, GET e água calculados) |
| GET | `/body-assessments/patient/:patientId` | Avaliações de um paciente |
| GET, PUT, DELETE | `/body-assessments/:id` | Busca / atualiza / exclui |
| GET, POST | `/foods` | Lista / cadastra alimentos |
| GET, PUT, DELETE | `/foods/:id` | Busca / atualiza / exclui |
| GET, POST | `/meal-plans` | Lista / atribui planos alimentares (com `dietId` e sem `meals`, copia o modelo) |
| GET | `/meal-plans/patient/:patientId` | Planos de um paciente |
| GET, PUT, DELETE | `/meal-plans/:id` | Busca / atualiza / exclui |
| GET, POST | `/diets` | Lista / cadastra modelos de dieta (com refeições) |
| GET, PUT, DELETE | `/diets/:id` | Busca / atualiza / exclui |

Exemplos prontos de requisições estão em [`back-end/requests/`](back-end/requests) (extensão REST Client do VS Code).

### Cálculos

- IMC = peso ÷ altura²
- TMB pela equação de Mifflin-St Jeor: 10 × peso + 6,25 × altura (cm) − 5 × idade + 5 (masculino) ou − 161 (feminino)
- GET = TMB × fator de atividade (1,2 a 1,9)
- Água = 35 ml × peso

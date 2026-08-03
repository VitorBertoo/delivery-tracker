# Rastreador de Pedidos

Aplicação full-stack de rastreamento de entregas construída com Java + Spring Boot no backend e React + TypeScript no frontend. Permite que operadores gerenciem pedidos e acompanhem entregas em tempo real em um mapa interativo.

---

## Rodando localmente

### Pré-requisitos
- Java 21+
- Maven 3.9+
- Node.js 20+

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

A API estará disponível em `http://localhost:8080`.
Swagger UI: `http://localhost:8080/swagger-ui/index.html`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

### Variáveis de ambiente

O arquivo `.env` já está incluído no repositório apontando para `http://localhost:8080`, por isso nenhuma configuração adicional é necessária para rodar localmente.

---

## Funcionalidades

- Autenticação de usuários com JWT (cadastro e login)
- Gerenciamento de pedidos: criação, listagem, detalhes e progressão de status
- Rastreamento de entrega em tempo real via WebSocket (STOMP sobre SockJS)
- Cálculo automático de rota entre a origem e o endereço de entrega
- Interpolação de posição ao longo da rota calculada
- Mapa interativo com visualização da rota e marcadores de entrega

---

## Stack

### Backend
- **Java 21** + **Spring Boot 4.1.0** (Spring Framework 7 / Jakarta EE 11)
- **Spring Security** — filtro JWT stateless
- **Spring Data JPA** + **Hibernate** — camada ORM
- **SQLite** via `xerial/sqlite-jdbc` + `hibernate-community-dialects`
- **Spring WebSocket** (broker STOMP) + `@Scheduled` para broadcast
- **OSRM** — motor de roteamento open-source para cálculo de rotas
- **Nominatim** (OpenStreetMap) — geocodificação gratuita, sem necessidade de chave de API
- **springdoc-openapi** — Swagger UI para documentação da API

### Frontend
- **React 19** + **Vite** + **TypeScript**
- **react-router-dom v7** — roteamento client-side
- **MapLibre GL JS** — renderização do mapa
- **OpenFreeMap** — provedor de tiles vetoriais gratuito, sem necessidade de chave de API
- **@stomp/stompjs** + **sockjs-client** — cliente WebSocket

---

## Arquitetura

### Backend

```
src/main/java/.../
├── config/          # Segurança, WebSocket, OpenAPI, encoder de senha
├── controller/      # Endpoints REST
├── dto/             # Records de request/response
├── model/           # Entidades JPA
├── repository/      # Interfaces Spring Data
├── security/        # Utilitário JWT e filtro de autenticação
└── service/         # Lógica de negócio
```

**Fluxo de autenticação:** O cliente envia as credenciais para `/auth/login`, recebe um JWT e o inclui como `Authorization: Bearer <token>` em todas as requisições. O `JwtAuthFilter` valida o token antes que a requisição chegue a qualquer controller. A autenticação é completamente stateless — nenhuma sessão é armazenada no servidor.

**Ciclo de vida do pedido:** Os pedidos progridem por uma sequência fixa de status: `RECEBIDO → EM_PREPARO → SAIU_PARA_ENTREGA → ENTREGUE`. Cada mudança de status é registrada em `order_history` para um histórico completo de auditoria. Quando um pedido chega a `SAIU_PARA_ENTREGA`, o rastreamento é iniciado automaticamente.

**Rastreamento:** Ao iniciar o rastreamento, o backend geocodifica o endereço de entrega via Nominatim e solicita uma rota ao OSRM. A geometria completa da rota (array de coordenadas GeoJSON), distância total e duração total são persistidas em `order_tracking`. Um scheduler transmite a posição atualizada a cada 5 segundos para `/topic/tracking/{orderId}`, interpolando a posição atual ao longo da rota usando o tempo decorrido e a fórmula de Haversine.

### Frontend

```
src/
├── api/             # Wrappers de fetch tipados (pedidos, autenticação)
├── components/      # DeliveryMap, StatusBadge
├── context/         # AuthContext (JWT no localStorage)
├── hooks/           # useTracking (assinatura WebSocket)
├── pages/           # LoginPage, RegisterPage, DashboardPage, OrderDetailPage
└── types/           # Interfaces TypeScript compartilhadas
```

O componente `DeliveryMap` gerencia sua própria instância do MapLibre via refs, tratando a race condition de carregamento de estilo com um padrão de ref pendente. Os marcadores são atualizados no lugar a cada broadcast de rastreamento, sem necessidade de recriação.

---

## Decisões de arquitetura

### SQLite como banco de dados

Optamos pelo SQLite por eliminar completamente a necessidade de instalar, configurar ou executar um servidor de banco de dados separado. Todo o banco é um único arquivo, o que simplifica o desenvolvimento local e facilita a execução por testadores — basta clonar o repositório e rodar a aplicação.

---

### Autenticação JWT stateless

JWTs são auto-contidos e dispensam qualquer estado no servidor. Isso simplifica a implementação e torna a autenticação independente de sessões, sem necessidade de um store compartilhado.

---

### Status denormalizado + tabela de histórico

O status atual do pedido é armazenado diretamente na tabela `orders`, permitindo consultas rápidas sem joins. A tabela `order_history` registra cada transição para um histórico completo de auditoria, combinando performance de leitura com rastreabilidade.

---

### OSRM para cálculo de rotas

O OSRM é totalmente open-source e retorna geometria detalhada de rota em GeoJSON. Por usar o servidor de demonstração público, nenhuma chave de API ou conta são necessários, facilitando a execução local por qualquer pessoa.

---

### Nominatim para geocodificação

O Nominatim é alimentado pelos dados do OpenStreetMap e não exige nenhuma chave de API. A implementação usa busca estruturada por campos separados (rua, cidade, estado), com fallback para cidade + estado quando o endereço exato não é encontrado, garantindo que o rastreamento funcione mesmo com nomes de rua informais.

---

### OpenFreeMap + MapLibre GL JS

O MapLibre GL JS é um fork open-source do Mapbox GL JS, com API idêntica e sem restrições de licença. O OpenFreeMap fornece tiles vetoriais gratuitamente e sem necessidade de cadastro ou chave de API, o que significa que o mapa funciona imediatamente ao clonar o projeto, sem nenhuma configuração adicional.

---

### Interpolação de posição no servidor com broadcast agendado

A posição atual do entregador é calculada no servidor a cada 5 segundos e transmitida via WebSocket para todos os clientes inscritos. Isso centraliza a lógica de simulação no backend, mantendo o frontend simples — ele apenas renderiza a posição recebida, sem precisar conhecer a rota ou o tempo decorrido.

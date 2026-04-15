# Online Shop Platform

DevOps-oriented full-stack project demonstrating:
- containerized application stack with Docker Compose
- CI/CD pipeline in GitLab
- reverse proxy and routing via HAProxy
- monitoring with Prometheus, Grafana and Alertmanager

Основной акцент в проекте сделан на инфраструктурную часть: контейнеризацию, routing, доставку изменений и мониторинг. Само приложение используется как удобный demo workload для этой инфраструктуры.

## Архитектура

```text
Browser
  |
  v
HAProxy (:80, :8404 stats)
  |----------------------------> frontend (Nginx + React)
  |
  +--> backend (Spring Boot)
         |--> PostgreSQL
         +--> search service

Backend exposes: /actuator/health, /actuator/prometheus
Monitoring stack: Prometheus + Grafana + Alertmanager + exporters
```

## Основной стек

- Docker / Docker Compose
- GitLab CI/CD
- HAProxy
- Prometheus
- Grafana
- Alertmanager
- cAdvisor
- node_exporter

Application services in the demo:
- Nginx + React
- Spring Boot
- PostgreSQL
- Elasticsearch

## Репозиторий

```text
.
├── backend/
├── frontend/
├── haproxy/
├── monitoring/
├── docker-compose.yaml
├── docker-compose-prod.yml
└── .gitlab-ci.yml
```

## Что реализовано

### Infrastructure focus
- приложение разворачивается через Docker Compose
- весь внешний трафик идёт через `HAProxy`
- backend отдаёт health и metrics endpoints
- monitoring stack поднимается отдельно от application stack

### CI/CD
- pipeline собирает отдельные Docker images для `backend`, `frontend`, `haproxy`
- образы публикуются в GitLab Container Registry
- есть smoke test через реальный входной маршрут проекта
- deploy использует immutable image tags по commit SHA
- staging deploy автоматический, production deploy ручной

### Monitoring
- `Prometheus` собирает метрики приложения, контейнеров и хоста
- `Grafana` используется для визуализации метрик
- `Alertmanager` обрабатывает алерты
- в рабочей конфигурации алерты отправляются в Telegram через приватный конфиг

## Переменные окружения

Скопируй шаблон:

```bash
cp .env.example .env
```

Базовый `.env`:

```env
DB_NAME=shop
DB_USER=shop_user
DB_PASSWORD=shop_password
REGISTRY_IMAGE=registry.gitlab.com/amixsol1-group/1917
IMAGE_TAG=replace-with-commit-sha
```

## Локальный запуск приложения

```bash
docker compose up -d --build
```

Доступ:
- frontend: `http://localhost/`
- HAProxy API endpoint: `http://localhost:8080/`
- HAProxy stats: `http://localhost:8404/`
- backend health: `http://localhost:8080/actuator/health`

Масштабирование backend:

```bash
docker compose up -d --scale backend=2
```

Остановка:

```bash
docker compose down
```

## Production-like запуск через registry images

Для этого режима лучше использовать immutable tag из CI/CD, а не `latest`.

```bash
docker compose --env-file .env -f docker-compose-prod.yml up -d
```

В этом режиме:
- внешний вход идёт через `HAProxy` на `:80`
- frontend не публикуется напрямую
- backend, db и search работают только во внутренней сети `shop-net`

## Monitoring запуск

Сначала подними application stack, чтобы появилась сеть `shop-net`.

Опционально подготовь monitoring env:

```bash
cp monitoring/.env.example monitoring/.env
```

Для Telegram alerts используется приватный файл `monitoring/alertmanager/alertmanager.private.yml`. Он не хранится в git и подключается через `monitoring/.env`.

Запуск monitoring stack:

```bash
docker compose --env-file .env --env-file monitoring/.env -f monitoring/docker-compose.yml up -d
```

Доступ:
- Prometheus: `http://localhost:9090/`
- Grafana: `http://localhost:3000/`
- Alertmanager: `http://localhost:9093/`
- cAdvisor: `http://localhost:8081/`
- node_exporter: `http://localhost:9100/metrics`

## Как проверить, что monitoring работает

После запуска monitoring stack достаточно проверить три вещи:
- в `Prometheus` на странице `Targets` основные jobs должны быть в статусе `UP`
- в `Grafana` должен открываться datasource `Prometheus` и графики по метрикам
- в `Alertmanager` должны быть видны правила и алерты

Если хочется быстро убедиться руками:

```bash
docker compose ps
docker compose -f monitoring/docker-compose.yml ps
curl http://localhost:8080/actuator/prometheus
```

Если `backend` отвечает на `/actuator/prometheus`, а `Prometheus` видит свои targets, значит мониторинг уже собирает метрики нормально.

## Скриншоты monitoring

Ниже несколько скриншотов из запущенного monitoring stack. Они показывают, что метрики реально собираются, визуализируются и могут использоваться для алертов.

### Prometheus

На этом экране видно, что `Prometheus` поднят и видит свои targets. Если здесь сервисы в статусе `UP`, значит сбор метрик работает корректно.

![Prometheus targets](<docs/prometheus.png>)

### Grafana + cAdvisor

Здесь показана визуализация метрик контейнеров в `Grafana`. Через `cAdvisor` можно смотреть нагрузку и состояние контейнеров в более удобном виде, чем через сырые метрики.

![Grafana with cAdvisor metrics](<docs/grafana cadvisor.png>)

### Node Exporter

Этот экран показывает метрики хоста через `node_exporter`: нагрузку, память и общее состояние системы. Это помогает видеть не только приложение, но и сам хост.

![Node Exporter metrics](<docs/node exporter.png>)

### Alertmanager

На этом скрине видно `Alertmanager`, который отвечает за обработку алертов. В моём локальном запуске он отправляет уведомления в Telegram, поэтому monitoring здесь не только собирает метрики, но и умеет сообщать о проблемах.

![Alertmanager alerts](<docs/alertmanager.png>)

## Основные endpoints

- `GET /api/products/`
- `GET /actuator/health`
- `GET /actuator/prometheus`

## GitLab CI/CD pipeline

Pipeline в [`.gitlab-ci.yml`](./.gitlab-ci.yml) делает следующее:
- `build`: собирает Docker images
- `push`: публикует images в GitLab Registry
- `test`: поднимает stack и проверяет его через HAProxy
- `deploy staging`: автоматически обновляет staging
- `deploy prod`: вручную обновляет production

## Что улучшает проект как portfolio piece

- есть не только локальный docker-compose, но и production-like compose
- deploy идёт через registry images, а не только локальный build
- backend теперь отдаёт Prometheus-compatible metrics
- README описывает архитектуру, запуск и pipeline

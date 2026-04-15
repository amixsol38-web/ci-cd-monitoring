# Online Shop Platform

Учебный full-stack / DevOps проект интернет-магазина с контейнеризацией, CI/CD, reverse proxy, load balancing и monitoring.

Проект показывает:
- frontend на React, который отдаётся через Nginx
- backend на Spring Boot с PostgreSQL и Elasticsearch
- маршрутизацию и балансировку API через HAProxy
- автоматическую сборку и публикацию Docker images в GitLab CI/CD
- staging/prod deploy через Docker Compose
- отдельный monitoring stack на Prometheus, Grafana, Alertmanager, cAdvisor, node_exporter и postgres_exporter

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
         +--> Elasticsearch

Backend exposes: /actuator/health, /actuator/prometheus
Monitoring stack: Prometheus + Grafana + Alertmanager + exporters
```

## Стек

- Docker / Docker Compose
- GitLab CI/CD
- HAProxy
- Nginx
- React
- Spring Boot
- PostgreSQL
- Elasticsearch
- Flyway
- Prometheus
- Grafana
- Alertmanager
- cAdvisor
- node_exporter

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

### Application stack
- React frontend собирается в статические файлы и обслуживается Nginx
- Spring Boot backend отдаёт REST API и health/metrics endpoints
- PostgreSQL хранит товары
- Elasticsearch используется для поиска
- HAProxy маршрутизирует `/api` и `/actuator` в backend, остальной трафик отдаёт во frontend

### CI/CD
- сборка отдельных Docker images для `backend`, `frontend`, `haproxy`
- push image tags в GitLab Container Registry
- smoke test через реальный входной маршрут проекта
- отдельный deploy в `staging`
- ручной deploy в `production`
- deploy использует immutable image tags по commit SHA

### Monitoring
- в репозитории есть отдельный monitoring stack
- backend теперь публикует `prometheus` metrics endpoint
- monitoring можно поднять отдельно от application stack

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
IMAGE_TAG=latest
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

Если хочешь включить Telegram alerts, создай приватный файл `monitoring/alertmanager/alertmanager.private.yml` на основе `monitoring/alertmanager/alertmanager.private.example.yml` и поменяй в `monitoring/.env` значение `ALERTMANAGER_CONFIG_FILE`.

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

После запуска monitoring stack проще всего проверить его по трём вещам:
- в `Prometheus` на странице `Targets` все основные jobs должны быть в статусе `UP`
- в `Grafana` должны открываться метрики из `Prometheus`
- в `Alertmanager` должны быть видны активные или готовые к отправке алерты

Если хочется быстро убедиться руками:

```bash
docker compose ps
docker compose -f monitoring/docker-compose.yml ps
curl http://localhost:8080/actuator/prometheus
```

Если `backend` отвечает на `/actuator/prometheus`, а `Prometheus` видит свои targets, значит сбор метрик уже работает нормально.

## Скриншоты monitoring

Ниже несколько скринов из запущенного monitoring stack. Они показывают, что метрики реально собираются, контейнеры видны в системе мониторинга, а алерты тоже отрабатывают.

### Prometheus

На этом экране видно, что `Prometheus` поднят и видит свои targets. Это базовая проверка: если здесь всё в статусе `UP`, значит мониторинг уже получает метрики от сервисов.

![Prometheus targets](<docs/prometheus.png>)

### Grafana + cAdvisor

Здесь показана визуализация метрик контейнеров в `Grafana`. Через `cAdvisor` можно смотреть нагрузку и состояние контейнеров, а сама `Grafana` удобна тем, что собирает всё в понятные графики, которые уже проще анализировать, чем сырые метрики.

![Grafana with cAdvisor metrics](<docs/grafana cadvisor.png>)

### Node Exporter

Этот экран показывает метрики хоста через `node_exporter`: нагрузку, память, состояние системы и другие системные показатели. Такой уровень мониторинга полезен, чтобы видеть не только приложение, но и состояние самой машины, на которой оно работает.

![Node Exporter metrics](<docs/node exporter.png>)

### Alertmanager

На этом скрине видно `Alertmanager`, который отвечает за обработку алертов. То есть monitoring в проекте не просто собирает цифры, а ещё умеет реагировать на проблемы и готов отправлять уведомления, если какой-то сервис перестанет отвечать или выйдет за пороги.

![Alertmanager alerts](<docs/alertmanager.png>)

## Основные endpoints

- `GET /api/products/`
- `GET /api/products/{id}`
- `GET /api/products/search?query=...`
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

## Ограничения и следующие шаги

- можно добавить integration tests для backend
- можно добавить готовые Grafana dashboards в provisioning
- можно вынести monitoring secrets из tracked configs
- можно улучшить Elasticsearch compatibility strategy

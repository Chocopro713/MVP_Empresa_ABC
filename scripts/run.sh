#!/bin/bash

# ================================================
# Script de ayuda para el proyecto ABC Orders
# ================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    echo ""
    echo "🚀 ABC Orders - Sistema de Gestión de Pedidos"
    echo "=============================================="
    echo ""
    echo "Uso: ./scripts/run.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  start       - Construir e iniciar todos los servicios"
    echo "  stop        - Detener todos los servicios"
    echo "  restart     - Reiniciar todos los servicios"
    echo "  logs        - Ver logs de todos los servicios"
    echo "  status      - Ver estado de los contenedores"
    echo "  clean       - Limpiar contenedores y volúmenes"
    echo "  build       - Solo construir las imágenes"
    echo "  health      - Verificar health de los servicios"
    echo "  help        - Mostrar esta ayuda"
    echo ""
}

start_services() {
    echo_info "Iniciando servicios..."
    docker-compose up --build -d
    echo_success "Servicios iniciados correctamente"
    echo ""
    echo "📍 URLs de acceso:"
    echo "   Frontend:     http://localhost:4200"
    echo "   Usuarios API: http://localhost:5001/swagger"
    echo "   Pedidos API:  http://localhost:5002/swagger"
    echo "   Pagos API:    http://localhost:5003/swagger"
    echo ""
    echo "🔑 Credenciales:"
    echo "   Admin:   admin / admin123"
    echo "   Usuario: usuario / user123"
}

stop_services() {
    echo_info "Deteniendo servicios..."
    docker-compose down
    echo_success "Servicios detenidos"
}

restart_services() {
    stop_services
    start_services
}

show_logs() {
    docker-compose logs -f
}

show_status() {
    echo_info "Estado de los contenedores:"
    docker-compose ps
}

clean_all() {
    echo_warning "Esto eliminará todos los contenedores y volúmenes"
    read -p "¿Está seguro? (y/N): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        echo_info "Limpiando..."
        docker-compose down -v --rmi all
        echo_success "Limpieza completada"
    else
        echo_info "Operación cancelada"
    fi
}

build_images() {
    echo_info "Construyendo imágenes..."
    docker-compose build
    echo_success "Imágenes construidas"
}

check_health() {
    echo_info "Verificando health de los servicios..."
    echo ""
    
    services=("localhost:5001" "localhost:5002" "localhost:5003")
    names=("Usuarios API" "Pedidos API" "Pagos API")
    
    for i in "${!services[@]}"; do
        if curl -s "http://${services[$i]}/health" > /dev/null 2>&1; then
            echo_success "${names[$i]}: OK"
        else
            echo_error "${names[$i]}: NO RESPONDE"
        fi
    done
}

# Main
case "${1:-help}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    clean)
        clean_all
        ;;
    build)
        build_images
        ;;
    health)
        check_health
        ;;
    help|*)
        show_help
        ;;
esac

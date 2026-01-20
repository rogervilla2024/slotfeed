#!/bin/bash
# SLOTFEED OCR System Management Script
# Manages the parallel OCR processing system

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NUM_WORKERS=${NUM_WORKERS:-6}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Copy service files to systemd
install_services() {
    print_status "Installing systemd service files..."

    cp ${SCRIPT_DIR}/systemd/slotfeed-ocr-worker@.service /etc/systemd/system/
    cp ${SCRIPT_DIR}/systemd/slotfeed-coordinator.service /etc/systemd/system/
    cp ${SCRIPT_DIR}/systemd/slotfeed-publisher.service /etc/systemd/system/
    cp ${SCRIPT_DIR}/systemd/slotfeed-worker-manager.service /etc/systemd/system/

    systemctl daemon-reload
    print_success "Service files installed"
}

# Start all OCR services (using individual workers)
start_individual() {
    print_status "Starting OCR system with ${NUM_WORKERS} individual workers..."

    # Start coordinator first
    systemctl start slotfeed-coordinator
    print_success "Coordinator started"

    # Start publisher
    systemctl start slotfeed-publisher
    print_success "Publisher started"

    # Start workers with staggered timing
    for i in $(seq 1 $NUM_WORKERS); do
        systemctl start slotfeed-ocr-worker@${i}
        print_success "Worker ${i} started"
        sleep 3  # Stagger startup
    done

    print_success "All OCR services started"
}

# Start all OCR services (using worker manager)
start_managed() {
    print_status "Starting OCR system with worker manager..."

    # Start coordinator first
    systemctl start slotfeed-coordinator
    print_success "Coordinator started"

    # Start publisher
    systemctl start slotfeed-publisher
    print_success "Publisher started"

    # Start worker manager (which spawns all workers)
    systemctl start slotfeed-worker-manager
    print_success "Worker manager started (managing ${NUM_WORKERS} workers)"

    print_success "All OCR services started"
}

# Stop all OCR services
stop_all() {
    print_status "Stopping all OCR services..."

    # Stop workers
    for i in $(seq 1 $NUM_WORKERS); do
        systemctl stop slotfeed-ocr-worker@${i} 2>/dev/null || true
    done

    # Stop worker manager
    systemctl stop slotfeed-worker-manager 2>/dev/null || true

    # Stop publisher
    systemctl stop slotfeed-publisher 2>/dev/null || true

    # Stop coordinator
    systemctl stop slotfeed-coordinator 2>/dev/null || true

    print_success "All OCR services stopped"
}

# Enable services for auto-start
enable_individual() {
    print_status "Enabling individual worker services for auto-start..."

    systemctl enable slotfeed-coordinator
    systemctl enable slotfeed-publisher

    for i in $(seq 1 $NUM_WORKERS); do
        systemctl enable slotfeed-ocr-worker@${i}
    done

    print_success "Services enabled"
}

enable_managed() {
    print_status "Enabling worker manager services for auto-start..."

    systemctl enable slotfeed-coordinator
    systemctl enable slotfeed-publisher
    systemctl enable slotfeed-worker-manager

    print_success "Services enabled"
}

# Disable services
disable_all() {
    print_status "Disabling OCR services..."

    for i in $(seq 1 $NUM_WORKERS); do
        systemctl disable slotfeed-ocr-worker@${i} 2>/dev/null || true
    done

    systemctl disable slotfeed-worker-manager 2>/dev/null || true
    systemctl disable slotfeed-publisher 2>/dev/null || true
    systemctl disable slotfeed-coordinator 2>/dev/null || true

    print_success "Services disabled"
}

# Show status of all services
status() {
    echo "=============================================="
    echo "         SLOTFEED OCR System Status          "
    echo "=============================================="
    echo ""

    echo "Coordinator:"
    systemctl status slotfeed-coordinator --no-pager -l 2>/dev/null | head -10 || echo "  Not running"
    echo ""

    echo "Publisher:"
    systemctl status slotfeed-publisher --no-pager -l 2>/dev/null | head -10 || echo "  Not running"
    echo ""

    echo "Worker Manager:"
    systemctl status slotfeed-worker-manager --no-pager -l 2>/dev/null | head -10 || echo "  Not running"
    echo ""

    echo "Individual Workers:"
    for i in $(seq 1 $NUM_WORKERS); do
        status=$(systemctl is-active slotfeed-ocr-worker@${i} 2>/dev/null || echo "inactive")
        if [ "$status" = "active" ]; then
            echo -e "  Worker ${i}: ${GREEN}active${NC}"
        else
            echo -e "  Worker ${i}: ${RED}inactive${NC}"
        fi
    done
    echo ""

    # Redis queue stats
    echo "Redis Queue Stats:"
    redis-cli LLEN ocr:jobs:high 2>/dev/null | xargs -I{} echo "  High Priority Queue: {}" || echo "  High Priority Queue: N/A"
    redis-cli LLEN ocr:jobs:normal 2>/dev/null | xargs -I{} echo "  Normal Queue: {}" || echo "  Normal Queue: N/A"
    redis-cli SCARD ocr:active 2>/dev/null | xargs -I{} echo "  Active Streams: {}" || echo "  Active Streams: N/A"
    echo ""
}

# Show logs
logs() {
    local service=$1
    local lines=${2:-50}

    case $service in
        coordinator)
            journalctl -u slotfeed-coordinator -f -n $lines
            ;;
        publisher)
            journalctl -u slotfeed-publisher -f -n $lines
            ;;
        manager)
            journalctl -u slotfeed-worker-manager -f -n $lines
            ;;
        worker)
            local worker_id=${3:-1}
            journalctl -u slotfeed-ocr-worker@${worker_id} -f -n $lines
            ;;
        all)
            journalctl -u 'slotfeed-*' -f -n $lines
            ;;
        *)
            echo "Usage: $0 logs {coordinator|publisher|manager|worker [id]|all} [lines]"
            exit 1
            ;;
    esac
}

# Restart a specific worker
restart_worker() {
    local worker_id=$1
    print_status "Restarting worker ${worker_id}..."
    systemctl restart slotfeed-ocr-worker@${worker_id}
    print_success "Worker ${worker_id} restarted"
}

# Main command handler
case "$1" in
    install)
        install_services
        ;;
    start)
        if [ "$2" = "managed" ]; then
            start_managed
        else
            start_individual
        fi
        ;;
    stop)
        stop_all
        ;;
    restart)
        stop_all
        sleep 2
        if [ "$2" = "managed" ]; then
            start_managed
        else
            start_individual
        fi
        ;;
    enable)
        if [ "$2" = "managed" ]; then
            enable_managed
        else
            enable_individual
        fi
        ;;
    disable)
        disable_all
        ;;
    status)
        status
        ;;
    logs)
        logs "$2" "$3" "$4"
        ;;
    restart-worker)
        restart_worker "${2:-1}"
        ;;
    *)
        echo "SLOTFEED OCR System Management"
        echo ""
        echo "Usage: $0 {command} [options]"
        echo ""
        echo "Commands:"
        echo "  install              Install systemd service files"
        echo "  start [managed]      Start all OCR services (individual or managed mode)"
        echo "  stop                 Stop all OCR services"
        echo "  restart [managed]    Restart all OCR services"
        echo "  enable [managed]     Enable services for auto-start"
        echo "  disable              Disable all OCR services"
        echo "  status               Show status of all services"
        echo "  logs <service>       Show logs (coordinator|publisher|manager|worker [id]|all)"
        echo "  restart-worker <id>  Restart a specific worker"
        echo ""
        echo "Environment Variables:"
        echo "  NUM_WORKERS          Number of OCR workers (default: 6)"
        echo ""
        echo "Examples:"
        echo "  $0 install                  # Install service files"
        echo "  $0 start                    # Start with individual workers"
        echo "  $0 start managed            # Start with worker manager"
        echo "  NUM_WORKERS=4 $0 start      # Start with 4 workers"
        echo "  $0 logs coordinator         # View coordinator logs"
        echo "  $0 logs worker 2            # View worker 2 logs"
        exit 1
        ;;
esac

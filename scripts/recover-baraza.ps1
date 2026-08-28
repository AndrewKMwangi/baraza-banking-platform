Write-Host "========================================="
Write-Host "       BARAZA RECOVERY WORKFLOW"
Write-Host "========================================="

Write-Host ""
Write-Host "[1/6] Checking Minikube..."

minikube status

if ($LASTEXITCODE -ne 0) {
    Write-Host "Minikube is not available."
    exit 1
}

Write-Host ""
Write-Host "[2/6] Checking Kubernetes..."

kubectl get nodes

if ($LASTEXITCODE -ne 0) {
    Write-Host "Kubernetes is not available."
    exit 1
}

Write-Host ""
Write-Host "[3/6] Creating Baraza namespace..."

kubectl apply -f .\applications\infrastructure\kubernetes\namespace\namespace.yaml

Write-Host ""
Write-Host "[4/6] Deploying PostgreSQL..."

kubectl apply -f .\applications\infrastructure\kubernetes\postgres\postgres-secret.yaml
kubectl apply -f .\applications\infrastructure\kubernetes\postgres\postgres-pvc.yaml
kubectl apply -f .\applications\infrastructure\kubernetes\postgres\postgres-deployment.yaml
kubectl apply -f .\applications\infrastructure\kubernetes\postgres\postgres-service.yaml

Write-Host ""
Write-Host "[5/6] Enabling Kubernetes addons..."

minikube addons enable metrics-server
minikube addons enable ingress

Write-Host ""
Write-Host "[6/6] Recovery prerequisites complete."

Write-Host ""
Write-Host "Current Baraza resources:"
kubectl get pods -n baraza-banking
kubectl get svc -n baraza-banking
kubectl get pvc -n baraza-banking
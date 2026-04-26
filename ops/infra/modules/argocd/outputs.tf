output "argocd_namespace" {
  description = "Namespace ArgoCD was installed into"
  value       = kubernetes_namespace.argocd.metadata[0].name
}

output "argocd_server_service" {
  description = "ArgoCD server service name — use to get the LoadBalancer URL"
  value       = "argocd-server"
}

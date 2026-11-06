import torch
import torch.nn as nn
import torch.nn.functional as F

class TopKSAE(nn.Module):
    def __init__(self, input_dim=512, hidden_dim=4096, top_k=256):
        super().__init__()
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.top_k = top_k

        self.encoder = nn.Linear(input_dim, hidden_dim)
        self.decoder = nn.Linear(hidden_dim, input_dim, bias=True)

    def forward(self, x):
        pre_activation = self.encoder(x)
        activated = F.relu(pre_activation)

        k = min(self.top_k, self.hidden_dim)
        top_values, top_indices = torch.topk(activated, k=k, dim=1)

        features = torch.zeros_like(activated)
        features.scatter_(1, top_indices, top_values)

        reconstruction = self.decoder(features)
        return reconstruction, features

    def normalize_decoder_weights(self):
        with torch.no_grad():
            norms = self.decoder.weight.norm(dim=0, keepdim=True)
            self.decoder.weight.div_(norms.clamp_min(1e-8))
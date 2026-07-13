package ma.doctorek.doctorek.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AddDocumentsRequisRequest(
        @NotEmpty @Size(max = 20) List<@Size(min = 1, max = 255) String> libelles) {}

package ma.doctorek.doctorek.dossier.application;

import ma.doctorek.doctorek.dossier.application.dto.DocumentMedicalResponse;
import ma.doctorek.doctorek.dossier.domain.DocumentMedical;
import ma.doctorek.doctorek.dossier.domain.DossierRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UploadDocumentUseCase {

    private final DossierRepository repository;
    private final String uploadDir;

    public UploadDocumentUseCase(
        DossierRepository repository,
        @Value("${doctorek.upload.dir:${user.home}/doctorek-uploads}") String uploadDir
    ) {
        this.repository = repository;
        this.uploadDir = uploadDir;
    }

    public DocumentMedicalResponse execute(UUID patientId, String typeDoc, MultipartFile file) throws IOException {
        Path dir = Paths.get(uploadDir, "dossier", patientId.toString());
        Files.createDirectories(dir);

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String fileName = UUID.randomUUID() + "_" + originalName;
        Path filePath = dir.resolve(fileName);
        file.transferTo(filePath);

        var doc = new DocumentMedical(
            null, patientId, originalName, typeDoc,
            filePath.toString(), file.getSize(), LocalDateTime.now()
        );
        return DocumentMedicalResponse.from(repository.saveDocument(doc));
    }
}

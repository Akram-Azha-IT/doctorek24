package ma.doctorek.doctorek.service;

import ma.doctorek.doctorek.repository.DocumentMedicalRepository;
import ma.doctorek.doctorek.repository.InfosMedicalesRepository;
import ma.doctorek.doctorek.repository.OrdonnanceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class DossierServiceFileValidationTest {

    @Mock InfosMedicalesRepository infosRepo;
    @Mock OrdonnanceRepository ordonnanceRepo;
    @Mock DocumentMedicalRepository documentRepo;
    @Mock MinioStorageService storageService;
    private DossierService service;

    @BeforeEach
    void setUp() {
        service = new DossierService(infosRepo, ordonnanceRepo, documentRepo, storageService);
    }

    @Test
    void rejectsExecutableBeforeStorage() {
        var file = new MockMultipartFile("file", "analyse.exe", "application/octet-stream", new byte[]{0x4D, 0x5A});
        assertThatThrownBy(() -> service.uploadDocument(UUID.randomUUID(), "Analyse", file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("PDF, JPG ou PNG");
        verifyNoInteractions(storageService, documentRepo);
    }

    @Test
    void rejectsSpoofedPdfBeforeStorage() {
        var file = new MockMultipartFile("file", "analyse.pdf", "application/pdf", "not-a-pdf".getBytes());
        assertThatThrownBy(() -> service.uploadDocument(UUID.randomUUID(), "Analyse", file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("PDF, JPG ou PNG");
        verifyNoInteractions(storageService, documentRepo);
    }
}

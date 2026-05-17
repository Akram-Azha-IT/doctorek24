package ma.doctorek.doctorek.admin.application;

import ma.doctorek.doctorek.admin.application.dto.CarteSummaryResponse;
import ma.doctorek.doctorek.admin.application.dto.CartesPageResponse;
import ma.doctorek.doctorek.carte.infrastructure.SpringDataCarteRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ListCartesUseCase {

    private final SpringDataCarteRepository carteRepository;

    public ListCartesUseCase(SpringDataCarteRepository carteRepository) {
        this.carteRepository = carteRepository;
    }

    public CartesPageResponse execute(int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        var result = carteRepository.findAll(pageable);
        return new CartesPageResponse(
                result.getContent().stream().map(CarteSummaryResponse::from).toList(),
                result.getTotalElements(),
                page,
                size
        );
    }
}

package ma.doctorek.doctorek;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Requires running infrastructure (PostgreSQL + Redis)")
class DoctorekApplicationTests {

	@Test
	void contextLoads() {
	}

}

package com.forma.domain.base.customer;

// Generated from: design/screens/CUS-001.yml

import com.forma.common.base.BaseController;
import com.forma.common.base.BaseService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer")
public class CustomerController extends BaseController {

    private final CustomerService service;

    public CustomerController(CustomerService service) {
        this.service = service;
    }

    @Override
    protected BaseService service() { return service; }
}

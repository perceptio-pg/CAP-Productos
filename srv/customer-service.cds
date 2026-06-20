using {com.logali as logali} from '../db/schema';

service CustomerService {
    entity Customers as projection on logali.Customer;
}

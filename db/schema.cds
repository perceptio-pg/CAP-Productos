namespace com.logali;

entity Products {
    key ID              : UUID;
        Name            : String;
        Description     : String;
        ImageUrl        : String;
        ReleaseDate     : DateTime;
        DiscotinuedDate : DateTime;
        Price           : Decimal(16, 2);
        Height          : Decimal(16, 2);
        Width           : Decimal(16, 2);
        Depth           : Decimal(16, 2);
        Quantity        : Decimal(16, 2);
};

entity Supplier {
    key ID         : UUID;
        Name       : String;
        Street     : String;
        City       : String;
        State      : String(2);
        PostalCode : String(5);
        Country    : String(3);
        Email      : String;
        Phone      : String;
        Fax        : String;
};

entity Category {
    key ID   : String(1);
        Name : String;
};

entity StockAvailability {
    key ID          : Integer;
        Description : String;
};

entity Currencies {
    key ID          : String(3);
        Description : String;
}

entity UnitOfMeasures {
    key ID          : String(2);
        Description : String;
};

entity DimensionUnits {
    key ID          : String(2);
        Description : String;
};

entity Months {
    key ID               : String(2);
        Description      : String;
        ShortDescription : String(3);
};

entity SalesData {
    key ID           : UUID;
        DeliveryDate : DateTime;
        Revenue      : Decimal(16, 2);
}
